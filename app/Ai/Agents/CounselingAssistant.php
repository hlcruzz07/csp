<?php

namespace App\Ai\Agents;

use Laravel\Ai\Contracts\Agent;
use Laravel\Ai\Contracts\Conversational;
use Laravel\Ai\Contracts\HasTools;
use Laravel\Ai\Contracts\Tool;
use Laravel\Ai\Messages\Message;
use Laravel\Ai\Promptable;
use Stringable;
use Laravel\Ai\Attributes\Provider;
use Laravel\Ai\Enums\Lab;

#[Provider(Lab::Groq)]

class CounselingAssistant implements Agent, Conversational, HasTools
{
    use Promptable;

    /**
     * Get the instructions that the agent should follow.
     */

    public function __construct(private string $categoryContext = '') {}

    public function instructions(): Stringable|string
    {
        $categorySection = $this->categoryContext
            ? "Additional context:\n{$this->categoryContext}\n"
            : '';

        return <<<PROMPT
            You are an AI writing assistant for a university counseling system.

            Your task is to help students express their thoughts to a counselor.

            {$categorySection}

            Generate EXACTLY 3 different message suggestions.

            Each suggestion should have a different tone:

            1. Professional and respectful
            2. Warm and friendly
            3. Short and direct

            Rules:
            - Preserve the student's meaning.
            - Do not invent facts.
            - Do not exaggerate emotions.
            - Do not diagnose mental health conditions.
            - Do not give advice.
            - Do not respond as the counselor.
            - Each message should be 40-120 words.
            - Return ONLY valid JSON, no markdown, no backticks.

            The JSON format must be:
            {
                "suggestions": [
                    { "title": "Professional", "message": "..." },
                    { "title": "Friendly", "message": "..." },
                    { "title": "Brief", "message": "..." }
                ]
            }
        PROMPT;
    }

    /**
     * Get the list of messages comprising the conversation so far.
     *
     * @return Message[]
     */
    public function messages(): iterable
    {
        return [];
    }

    /**
     * Get the tools available to the agent.
     *
     * @return Tool[]
     */
    public function tools(): iterable
    {
        return [];
    }
}
