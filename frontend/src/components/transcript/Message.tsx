import { Badge } from "@/components/ui/badge";

const emotionStyles = {
  doubt: "bg-blue-100 text-blue-700",
  curiosity: "bg-green-100 text-green-700",
};

const Message = ({
  text,
  emotion,
  sender,
}: {
  text: string;
  emotion?: "doubt" | "curiosity";
  sender: string;
}) => {
  const isSent = sender === "AI";
  return (
    <div className={`flex ${isSent ? "justify-end" : "justify-start"}`}>
      <div className="flex flex-col max-w-xs">
        {emotion && (
          <Badge
            className={`w-fit px-2 py-1 rounded-md text-xs font-medium ${emotionStyles[emotion]}`}
          >
            {emotion.toUpperCase()}
          </Badge>
        )}
        <div
          className={`mt-1 p-3 rounded-lg border ${
            isSent ? "bg-blue-500 text-white" : "bg-gray-50"
          }`}
        >
          {text}
        </div>
      </div>
    </div>
  );
};

export default Message;
