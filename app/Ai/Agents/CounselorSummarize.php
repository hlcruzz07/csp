<?php

namespace App\Ai\Agents;

use Laravel\Ai\Attributes\Provider;
use Laravel\Ai\Contracts\Agent;
use Laravel\Ai\Enums\Lab;
use Laravel\Ai\Promptable;
use Stringable;

#[Provider(Lab::Groq)]
class CounselorSummarize implements Agent
{
    use Promptable;

    public function instructions(): Stringable|string
    {
        return <<<'PROMPT'
        You are assisting a university guidance counselor. You will receive a chat transcript
        between a Student and a Counselor. Summarize it in plain text (no markdown, no headings),
        in under 150 words, covering:
        - the student's main concerns and how they seem to be feeling
        - what the counselor has already advised or done
        - any open questions or suggested follow-ups

        Be neutral and factual. Only use what is in the transcript; do not invent details,
        diagnoses, or names. If the transcript is too short to say anything meaningful,
        say so briefly.
        PROMPT;
    }
}