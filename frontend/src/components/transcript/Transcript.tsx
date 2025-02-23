import { useState } from "react";
import "./Transcript.css"; // Import the CSS file for styling

import { Card, CardContent } from "@/components/ui/card";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { Circle } from "lucide-react";

import Message from "./Message";

interface Message {
  sender: string;
  text: string;
  emotion?: "doubt" | "curiosity";
}

interface Message {
  sender: string;
  text: string;
  emotion?: "doubt" | "curiosity";
}

const messages: Message[] = [
  {
    sender: "J",
    text: "I’m not sure if this is worth discussing, but I recently started a new project that isn’t going very well at all.",
    emotion: "doubt",
  },
  {
    sender: "AI",
    text: "Don’t doubt yourself – that sounds like a really interesting place to start. Tell me more about that project…",
    emotion: "curiosity",
  },
];

const Transcript = () => {
  return (
    <Card className="w-full max-w-md mx-auto border shadow-md p-4 mt-4">
      <h2 className="text-lg font-semibold">Transcript</h2>
      <Accordion type="single" collapsible>
        <AccordionItem value="transcript">
          <AccordionTrigger className="bg-gray-100 p-3 mt-2 rounded-md w-full">
            <div className="text-xs text-gray-500 flex justify-between w-full">
              <span>MONDAY 24 FEBRUARY 2025</span>
              <div className="flex items-center text-xs text-gray-500">
                <Circle className="w-2 h-2 text-red-500 mr-1" /> 00:30
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <CardContent className="mt-4 space-y-4">
              {messages.map((msg, index) => (
                <Message
                  key={index}
                  text={msg.text}
                  emotion={msg.emotion}
                  sender={msg.sender}
                />
              ))}
            </CardContent>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </Card>
  );
};

export default Transcript;
