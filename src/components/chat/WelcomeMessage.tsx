import { Bot } from "lucide-react";

/**
 * Welcome message shown when the chat is empty
 */
export function WelcomeMessage() {
    return (
        <div className="bg-[#141414] px-5 py-5 border-b border-[rgba(255,255,255,0.05)] animate-fadeInUp">
            <div className="max-w-3xl mx-auto flex gap-6 items-start">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-red-500 flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1 text-[#ececec] leading-relaxed">
                    <h3 className="font-bold text-blue-500 text-lg mb-3">Welcome to FRC RAG!</h3>
                    <p className="text-[#dcdcdc] mb-4">
                        I can help you with First Robotics Competition questions using data from team technical binders. Here&apos;s what I can do:
                    </p>
                    <div className="space-y-2 text-[#b4b4b4] mb-4 pl-4">
                        <div><strong className="text-[#ececec]">Answer technical questions</strong> about FRC robots, mechanisms, and strategies</div>
                        <div><strong className="text-[#ececec]">Find relevant images</strong> from team documentation</div>
                        <div><strong className="text-[#ececec]">Explain game pieces and mechanisms</strong> with enhanced context</div>
                        <div><strong className="text-[#ececec]">Provide detailed analysis</strong> based on team technical documentation</div>
                    </div>
                    <p className="text-[#dcdcdc] mb-3">Try asking me something like:</p>
                    <div className="space-y-1 text-[#b4b4b4] mb-4 italic pl-4">
                        <div>&quot;How do teams handle ground intake?&quot;</div>
                        <div>&quot;Show me swerve drive implementations&quot;</div>
                        <div>&quot;What are elements of a good climber?&quot;</div>
                    </div>
                    <p className="text-[#dcdcdc]"><strong className="text-[#ececec]">Just type your question below to get started!</strong></p>
                </div>
            </div>
        </div>
    );
}
