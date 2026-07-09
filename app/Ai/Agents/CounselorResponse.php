<?php

namespace App\Ai\Agents;

use Laravel\Ai\Attributes\Provider;
use Laravel\Ai\Contracts\Agent;
use Laravel\Ai\Contracts\Conversational;
use Laravel\Ai\Contracts\HasTools;
use Laravel\Ai\Contracts\Tool;
use Laravel\Ai\Enums\Lab;
use Laravel\Ai\Messages\Message;
use Laravel\Ai\Promptable;
use Stringable;

#[Provider(Lab::Groq)]
class CounselorResponse implements Agent, Conversational, HasTools
{
    use Promptable;

    /**
     * @param array<int, string> $studentMessages
     */
    public function __construct(
        private array $studentMessages = []
    ) {
    }

    /**
     * Get the instructions that the agent should follow.
     */
    public function instructions(): Stringable|string
    {
        $conversation = '';

        if (!empty($this->studentMessages)) {
            $conversation = "Student messages:\n";

            foreach ($this->studentMessages as $index => $message) {
                $conversation .= ($index + 1) . ". {$message}\n";
            }

            $conversation .= "\n";
        }

        return <<<PROMPT
            You are an AI writing assistant for university counselors.

            Your task is to help counselors write thoughtful, empathetic, and professional responses to students.

            {$conversation}

            Read the student's messages carefully and understand:
            - their concerns
            - their emotions (only if clearly expressed)
            - what they may be asking for
            - how the counselor can continue the conversation

            Generate EXACTLY 3 response suggestions.

            Each suggestion should have a different tone:

            1. Professional and supportive
            2. Warm and empathetic
            3. Brief and encouraging

            Rules:
            - Respond as the counselor.
            - Acknowledge the student's concerns.
            - Validate feelings without exaggerating.
            - Do not diagnose mental health conditions.
            - Do not assume facts that were not mentioned.
            - Do not promise outcomes you cannot guarantee.
            - Encourage further conversation when appropriate.
            - Keep a respectful and non-judgmental tone.
            - Each response should be 50-150 words.
            - Return ONLY valid JSON.
            - No markdown.
            - No backticks.

            The JSON format must be:

            {
                "suggestions": [
                    {
                        "title": "Professional",
                        "message": "..."
                    },
                    {
                        "title": "Empathetic",
                        "message": "..."
                    },
                    {
                        "title": "Brief",
                        "message": "..."
                    }
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