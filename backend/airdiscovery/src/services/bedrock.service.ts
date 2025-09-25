import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  BedrockRuntimeClient,
  InvokeModelCommand,
  InvokeModelWithResponseStreamCommand,
} from '@aws-sdk/client-bedrock-runtime';
import { BedrockAgentRuntimeClient, RetrieveAndGenerateCommand } from '@aws-sdk/client-bedrock-agent-runtime';
import { fromCognitoIdentityPool } from '@aws-sdk/credential-providers';
import { defaultBedrockConfig, modelPresets, systemPrompts, validateModelResponse, extractTextFromResponse } from '../config/bedrock.config';

export interface BedrockInvokeParams {
  prompt: string;
  systemPrompt?: string;
  temperature?: number;
  topP?: number;
  maxTokens?: number;
  useStreaming?: boolean;
}

export interface BedrockResponse {
  content: string;
  usage?: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  };
  finishReason?: string;
}

@Injectable()
export class BedrockService {
  private readonly logger = new Logger(BedrockService.name);
  private bedrockClient: BedrockRuntimeClient;
  private bedrockAgentClient: BedrockAgentRuntimeClient;

  constructor(private configService: ConfigService) {
    this.initializeClients();
  }

  /**
   * Initialize Bedrock clients with appropriate credentials
   */
  private initializeClients() {
    const region = this.configService.get('AWS_REGION', defaultBedrockConfig.region);
    const identityPoolId = this.configService.get('COGNITO_IDENTITY_POOL_ID');

    // Configure credentials - use Cognito Identity Pool if available, otherwise default
    const credentials = identityPoolId
      ? fromCognitoIdentityPool({
          clientConfig: { region },
          identityPoolId,
        })
      : undefined; // Will use default credential chain

    this.bedrockClient = new BedrockRuntimeClient({
      region,
      credentials,
    });

    this.bedrockAgentClient = new BedrockAgentRuntimeClient({
      region,
      credentials,
    });

    this.logger.log(`Bedrock clients initialized for region: ${region}`);
  }

  /**
   * Invoke Amazon Nova Premier model with a text prompt
   */
  async invokeModel(params: BedrockInvokeParams): Promise<BedrockResponse> {
    try {
      const modelId = defaultBedrockConfig.modelId;
      const {
        prompt,
        systemPrompt = systemPrompts.travelAgent,
        temperature = defaultBedrockConfig.temperature,
        topP = defaultBedrockConfig.topP,
        maxTokens = defaultBedrockConfig.maxTokens,
        useStreaming = false,
      } = params;

      // Format the input for Nova Premier model
      const input = {
        modelId,
        contentType: 'application/json',
        accept: 'application/json',
        body: JSON.stringify({
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: `${systemPrompt}\\n\\nUser: ${prompt}`,
                },
              ],
            },
          ],
          inferenceConfig: {
            temperature,
            topP,
            maxTokens,
          },
        }),
      };

      if (useStreaming) {
        return this.invokeModelWithStreaming(input);
      }

      const command = new InvokeModelCommand(input);
      const response = await this.bedrockClient.send(command);

      if (!response.body) {
        throw new Error('No response body received from Bedrock');
      }

      // Parse the response
      const responseBody = JSON.parse(new TextDecoder().decode(response.body));
      
      if (!validateModelResponse(responseBody)) {
        throw new Error('Invalid response format from Bedrock model');
      }

      const content = extractTextFromResponse(responseBody);
      
      return {
        content,
        usage: responseBody.usage
          ? {
              inputTokens: responseBody.usage.inputTokens || 0,
              outputTokens: responseBody.usage.outputTokens || 0,
              totalTokens: responseBody.usage.totalTokens || 0,
            }
          : undefined,
        finishReason: responseBody.stopReason,
      };
    } catch (error) {
      this.logger.error('Error invoking Bedrock model:', error);
      throw new Error(`Failed to invoke Bedrock model: ${error.message}`);
    }
  }

  /**
   * Invoke model with response streaming for real-time responses
   */
  private async invokeModelWithStreaming(input: any): Promise<BedrockResponse> {
    try {
      const command = new InvokeModelWithResponseStreamCommand(input);
      const response = await this.bedrockClient.send(command);

      let content = '';
      let usage: any = undefined;
      let finishReason: string | undefined;

      if (response.body) {
        for await (const chunk of response.body) {
          if (chunk.chunk?.bytes) {
            const chunkData = JSON.parse(new TextDecoder().decode(chunk.chunk.bytes));
            
            if (chunkData.contentBlockDelta?.delta?.text) {
              content += chunkData.contentBlockDelta.delta.text;
            }
            
            if (chunkData.messageStop) {
              usage = chunkData.amazonBedrockInvocationMetrics;
              finishReason = chunkData.messageStop.stopReason;
            }
          }
        }
      }

      return {
        content,
        usage: usage
          ? {
              inputTokens: usage.inputTokenCount || 0,
              outputTokens: usage.outputTokenCount || 0,
              totalTokens: (usage.inputTokenCount || 0) + (usage.outputTokenCount || 0),
            }
          : undefined,
        finishReason,
      };
    } catch (error) {
      this.logger.error('Error with streaming invoke:', error);
      throw new Error(`Failed to invoke Bedrock model with streaming: ${error.message}`);
    }
  }

  /**
   * Generate travel recommendations based on user profile and destination
   */
  async generateTravelRecommendations(
    destination: string,
    profileType: string,
    preferences?: string[],
  ): Promise<string> {
    const preferencesText = preferences?.length ? ` They are particularly interested in: ${preferences.join(', ')}.` : '';
    
    const prompt = `Generate personalized travel recommendations for a ${profileType} traveler visiting ${destination}.${preferencesText} 
                   Please include:
                   1. Top 5 attractions suited for this traveler type
                   2. Recommended accommodations
                   3. Local dining experiences
                   4. Unique activities or experiences
                   5. Practical travel tips
                   
                   Format the response in a clear, engaging way that helps them plan their trip.`;

    const response = await this.invokeModel({
      prompt,
      systemPrompt: systemPrompts.destinationExpert,
      ...modelPresets.travelRecommendations,
    });

    return response.content;
  }

  /**
   * Create a detailed travel itinerary
   */
  async createItinerary(
    destination: string,
    days: number,
    budget: number, // Budget in cents
    interests: string[],
  ): Promise<string> {
    // Convert budget from cents to formatted currency
    const budgetInReais = budget / 100;
    const formattedBudget = new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(budgetInReais);

    const prompt = `Create a detailed ${days}-day itinerary for ${destination} with a ${formattedBudget} budget. 
                   The traveler is interested in: ${interests.join(', ')}.
                   
                   Please provide:
                   - Day-by-day schedule with specific activities
                   - Estimated costs for major expenses
                   - Restaurant recommendations for each day
                   - Transportation suggestions between activities
                   - Alternative options for different weather conditions
                   
                   Format as a comprehensive travel guide.`;

    const response = await this.invokeModel({
      prompt,
      systemPrompt: systemPrompts.travelAgent,
      ...modelPresets.travelRecommendations,
    });

    return response.content;
  }

  /**
   * Answer specific travel questions using Knowledge Base (RAG)
   */
  async answerTravelQuestion(question: string, context?: string): Promise<string> {
    const knowledgeBaseId = this.configService.get('BEDROCK_KNOWLEDGE_BASE_ID');
    
    if (knowledgeBaseId) {
      try {
        return await this.retrieveAndGenerate(question, knowledgeBaseId);
      } catch (error) {
        this.logger.warn('Knowledge Base query failed, falling back to direct model invoke:', error);
      }
    }

    // Fallback to direct model invocation
    const contextText = context ? `Context: ${context}\\n\\n` : '';
    const prompt = `${contextText}Question: ${question}`;

    const response = await this.invokeModel({
      prompt,
      systemPrompt: systemPrompts.travelAgent,
      ...modelPresets.travelQuestions,
    });

    return response.content;
  }

  /**
   * Use Bedrock Knowledge Base for RAG (Retrieval Augmented Generation)
   */
  private async retrieveAndGenerate(query: string, knowledgeBaseId: string): Promise<string> {
    try {
      const command = new RetrieveAndGenerateCommand({
        input: {
          text: query,
        },
        retrieveAndGenerateConfiguration: {
          type: 'KNOWLEDGE_BASE',
          knowledgeBaseConfiguration: {
            knowledgeBaseId,
            modelArn: defaultBedrockConfig.modelArn,
            retrievalConfiguration: {
              vectorSearchConfiguration: {
                numberOfResults: 5,
              },
            },
          },
        },
      });

      const response = await this.bedrockAgentClient.send(command);
      return response.output?.text || 'No response generated from knowledge base.';
    } catch (error) {
      this.logger.error('Error with Knowledge Base RAG:', error);
      throw error;
    }
  }

  /**
   * Get flight booking advice
   */
  async getFlightAdvice(
    origin: string,
    destination: string,
    dates: string,
    passengers: number,
    preferences?: string[],
  ): Promise<string> {
    const preferencesText = preferences?.length ? ` Preferences: ${preferences.join(', ')}.` : '';
    
    const prompt = `Provide flight booking advice for:
                   - Route: ${origin} to ${destination}
                   - Travel dates: ${dates}
                   - Passengers: ${passengers}${preferencesText}
                   
                   Please include:
                   1. Best booking timing recommendations
                   2. Airline suggestions and why
                   3. Route optimization tips
                   4. Cost-saving strategies
                   5. Comfort and convenience factors to consider
                   
                   Be specific and actionable in your advice.`;

    const response = await this.invokeModel({
      prompt,
      systemPrompt: systemPrompts.flightAdvisor,
      ...modelPresets.factualInfo,
    });

    return response.content;
  }

  /**
   * Health check for Bedrock service
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.invokeModel({
        prompt: 'Hello, this is a health check. Please respond with "OK".',
        maxTokens: 10,
        temperature: 0.1,
      });
      
      return response.content.toLowerCase().includes('ok');
    } catch (error) {
      this.logger.error('Bedrock health check failed:', error);
      return false;
    }
  }
}
