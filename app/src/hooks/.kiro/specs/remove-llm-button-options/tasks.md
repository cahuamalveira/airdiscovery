# Implementation Plan

- [x] 1. Write tests first (TDD approach)






  - [x] 1.1 Create button-options-generator.spec.ts tests

    - Test adult options returned when stage is collecting_passengers and no adults collected
    - Test children options returned when adults collected but children is null
    - Test null returned for non-passenger stages (collecting_origin, collecting_budget, etc.)
    - Test null returned when all passenger data is collected
    - _Requirements: 4.2, 2.1, 2.2, 2.3_

  - [x] 1.2 Update json-prompt-builder.spec.ts tests


    - Add test verifying button_options is NOT in the JSON schema
    - Add test verifying button_options is NOT in the examples
    - Add test verifying no "COM BOTÕES" instructions in prompt
    - Update existing tests that expect button_options to be present
    - _Requirements: 4.1, 1.1, 1.2, 1.3_

- [x] 2. Create ButtonOptionsGenerator utility (make tests pass)





  - [x] 2.1 Create button-options-generator.ts with static button options


    - Define PASSENGER_BUTTON_OPTIONS constant with adults and children options
    - Implement getButtonOptionsForStage function that returns correct options based on stage and data
    - Export ButtonOption interface
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [x] 3. Remove button_options from LLM prompt (make tests pass)





  - [x] 3.1 Update JsonPromptBuilder to remove button_options from JSON schema


    - Remove button_options field from JSON_SCHEMA constant
    - Remove button_options instructions from INTERVIEW_FLOW
    - Remove "COM BOTÕES" references from all sections
    - _Requirements: 1.1, 1.2_

  - [x] 3.2 Update JsonPromptBuilder examples to remove button_options


    - Remove button_options from all example JSON responses in EXAMPLES constant
    - _Requirements: 1.3_

- [x] 4. Update ChatbotService to inject button_options





  - [x] 4.1 Import and use ButtonOptionsGenerator in ChatbotService


    - Import getButtonOptionsForStage from button-options-generator
    - Call generator in processCompleteResponse method after parsing LLM response
    - Inject button_options into response before sending to frontend
    - _Requirements: 3.1, 3.2, 3.3_


  - [x] 4.2 Update JsonResponseParser to ignore LLM button_options

    - Remove button_options validation from validateParsedData
    - Keep backward compatibility by not failing if button_options is present in LLM response
    - _Requirements: 1.4_

- [x] 5. Run all tests and verify






  - [x] 5.1 Run all chatbot-related tests and fix any failures

    - Verify button-options-generator tests pass
    - Verify json-prompt-builder tests pass
    - Verify json-response-parser tests pass
    - _Requirements: 4.1, 4.2, 4.3_
