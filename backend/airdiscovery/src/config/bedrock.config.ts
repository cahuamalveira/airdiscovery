/**
 * AWS Bedrock Configuration for Air Discovery
 * 
 * This file contains the configuration needed to connect to Amazon Bedrock
 * and specifically the Nova Premier v1:0 model for AI-powered travel recommendations.
 */

export interface BedrockConfig {
  /**
   * The region where Bedrock services are deployed
   */
  region: string;
  
  /**
   * The ARN of the Amazon Nova Premier v1:0 model
   */
  modelArn: string;
  
  /**
   * The model ID for direct API calls
   */
  modelId: string;
  
  /**
   * Maximum tokens for model responses
   */
  maxTokens: number;
  
  /**
   * Temperature for model creativity (0.0 to 1.0)
   */
  temperature: number;
  
  /**
   * Top-p for nucleus sampling
   */
  topP: number;
  
  /**
   * Knowledge Base ID for RAG capabilities (optional)
   */
  knowledgeBaseId?: string;
}

/**
 * Default Bedrock configuration for Air Discovery
 */
export const defaultBedrockConfig: BedrockConfig = {
  region: process.env.AWS_REGION || 'us-east-2',
  modelArn: `arn:aws:bedrock:${process.env.AWS_REGION || 'us-east-2'}::foundation-model/amazon.nova-premier-v1:0`,
  modelId: 'amazon.nova-premier-v1:0',
  maxTokens: 4096,
  temperature: 0.7,
  topP: 0.9,
  knowledgeBaseId: process.env.BEDROCK_KNOWLEDGE_BASE_ID,
};

/**
 * Model inference parameters for different use cases
 */
export const modelPresets = {
  /**
   * For generating travel recommendations and itineraries
   */
  travelRecommendations: {
    temperature: 0.8,
    topP: 0.9,
    maxTokens: 2048,
  },
  
  /**
   * For answering specific travel questions
   */
  travelQuestions: {
    temperature: 0.3,
    topP: 0.7,
    maxTokens: 1024,
  },
  
  /**
   * For creative content like destination descriptions
   */
  creativeContent: {
    temperature: 0.9,
    topP: 0.95,
    maxTokens: 1536,
  },
  
  /**
   * For factual information retrieval
   */
  factualInfo: {
    temperature: 0.1,
    topP: 0.5,
    maxTokens: 512,
  },
};

/**
 * System prompts for different AI assistant roles
 */
export const systemPrompts = {
  travelAgent: `You are an expert travel agent assistant for Air Discovery, a premium travel platform. 
    Your role is to provide personalized travel recommendations, create detailed itineraries, and help users 
    discover amazing destinations based on their preferences and travel style. 
    Always be helpful, knowledgeable, and enthusiastic about travel while maintaining professionalism.
    Focus on providing practical, actionable advice with specific recommendations for flights, accommodations, 
    activities, and local experiences.`,
    
  destinationExpert: `You are a destination expert for Air Discovery specializing in detailed location information. 
    Provide comprehensive insights about destinations including cultural highlights, best times to visit, 
    local customs, must-see attractions, hidden gems, dining recommendations, and practical travel tips. 
    Your responses should be informative, engaging, and help travelers make informed decisions.`,
    
  flightAdvisor: `You are a flight booking advisor for Air Discovery. Help users find the best flight options 
    by analyzing their travel needs, preferences, and budget. Provide advice on booking timing, route optimization, 
    airline recommendations, and money-saving tips. Always consider factors like comfort, convenience, and value.`,
};

/**
 * Message templates for different interaction types
 */
export const messageTemplates = {
  welcomeMessage: "Welcome to Air Discovery! I'm your AI travel assistant. How can I help you plan your next adventure?",
  
  recommendationRequest: (destination: string, profileType: string) => 
    `Please provide personalized travel recommendations for ${destination} based on a ${profileType} traveler profile. 
     Include specific activities, accommodations, and experiences that would appeal to this traveler type.`,
     
  itineraryRequest: (destination: string, days: number, budget: number, interests: string[]) => {
    // Convert budget from cents to formatted currency
    const budgetInReais = budget / 100;
    const formattedBudget = new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(budgetInReais);

    return `Create a detailed ${days}-day itinerary for ${destination} with a ${formattedBudget} budget. 
     The traveler is interested in: ${interests.join(', ')}. 
     Include daily activities, estimated costs, and practical tips.`;
  },
     
  flightSearchAssistance: (origin: string, destination: string, dates: string, passengers: number) =>
    `Help me find the best flight options from ${origin} to ${destination} for ${dates} with ${passengers} passenger(s). 
     Consider factors like price, duration, and convenience.`,
};

/**
 * Error messages for Bedrock integration
 */
export const errorMessages = {
  modelUnavailable: "The AI travel assistant is temporarily unavailable. Please try again later.",
  rateLimitExceeded: "Too many requests. Please wait a moment before asking another question.",
  invalidInput: "I couldn't understand your request. Could you please rephrase it?",
  networkError: "Connection issue. Please check your internet connection and try again.",
  authenticationError: "Authentication required. Please sign in to use the AI travel assistant.",
};

/**
 * Utility function to validate model response
 */
export const validateModelResponse = (response: any): boolean => {
  if (!response || typeof response !== 'object') {
    return false;
  }
  
  // Check for required fields based on Nova Premier response structure
  return response.content && Array.isArray(response.content) && response.content.length > 0;
};

/**
 * Utility function to extract text from model response
 */
export const extractTextFromResponse = (response: any): string => {
  if (!validateModelResponse(response)) {
    throw new Error('Invalid model response format');
  }
  
  // Extract text from Nova Premier response structure
  const textContent = response.content.find((item: any) => item.type === 'text');
  return textContent?.text || '';
};
