# Requirements Document

## Introduction

This feature moves button_options generation from the LLM to a static backend utility. The LLM will no longer be responsible for generating button options - instead, the backend will generate them based on the conversation stage and collected data. This simplifies the LLM prompt, reduces token usage, eliminates JSON parsing issues, and provides a single source of truth for button options that is immune to prompt injection.

## Glossary

- **LLM**: Large Language Model (AWS Bedrock Claude) used for chatbot responses
- **button_options**: JSON array of interactive button choices for passenger selection
- **JsonPromptBuilder**: Backend utility that constructs the system prompt for the LLM
- **JsonResponseParser**: Backend utility that validates and parses LLM responses
- **ButtonOptionsGenerator**: New backend utility that generates button options based on conversation state
- **ChatbotService**: Backend service that orchestrates chat responses

## Requirements

### Requirement 1

**User Story:** As a developer, I want to remove button_options from the LLM prompt, so that the LLM focuses only on conversation content and doesn't generate UI elements.

#### Acceptance Criteria

1. WHEN the JsonPromptBuilder generates a system prompt, THE System SHALL NOT include any references to button_options in the JSON schema.
2. WHEN the JsonPromptBuilder generates a system prompt, THE System SHALL NOT include instructions for generating button_options.
3. WHEN the JsonPromptBuilder generates examples, THE System SHALL NOT include button_options in any example JSON responses.
4. WHEN the LLM generates a response, THE System SHALL NOT expect button_options in the response.

### Requirement 2

**User Story:** As a developer, I want a backend utility to generate button options statically, so that button options are consistent and secure.

#### Acceptance Criteria

1. WHEN the conversation stage is "collecting_passengers" and adults are not yet collected, THE ButtonOptionsGenerator SHALL return adult selection options (1-4 adults).
2. WHEN the conversation stage is "collecting_passengers" and adults are collected but children are not, THE ButtonOptionsGenerator SHALL return children selection options (0-3 children).
3. WHEN the conversation stage is not "collecting_passengers", THE ButtonOptionsGenerator SHALL return null.
4. WHEN the ButtonOptionsGenerator generates options, THE System SHALL use predefined static values that cannot be modified by user input.

### Requirement 3

**User Story:** As a developer, I want the ChatbotService to inject button_options into responses, so that the frontend receives them without LLM involvement.

#### Acceptance Criteria

1. WHEN the ChatbotService processes a complete response, THE System SHALL call ButtonOptionsGenerator to determine if buttons are needed.
2. WHEN ButtonOptionsGenerator returns options, THE ChatbotService SHALL include them in the response sent to the frontend.
3. WHEN ButtonOptionsGenerator returns null, THE ChatbotService SHALL NOT include button_options in the response.

### Requirement 4

**User Story:** As a developer, I want to update the tests, so that they verify the new static button generation approach.

#### Acceptance Criteria

1. WHEN the json-prompt-builder.spec.ts tests run, THE System SHALL verify that button_options is NOT mentioned in the prompt.
2. WHEN the ButtonOptionsGenerator tests run, THE System SHALL verify correct button options are returned for each stage.
3. WHEN the ChatbotService tests run, THE System SHALL verify button_options are injected correctly into responses.
