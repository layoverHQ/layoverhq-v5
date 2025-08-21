"use client"

import type React from "react"

import { useState } from "react"
import { MessageCircle, Phone, Mail, Clock, Send, X, Minimize2, Maximize2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface ChatMessage {
  id: string
  sender: "user" | "agent"
  message: string
  timestamp: string
}

export function CustomerSupport() {
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: "1",
      sender: "agent",
      message:
        "Hi! I'm here to help you with your LayoverHQ experience. How can I assist you today?",
      timestamp: new Date().toLocaleTimeString(),
    },
  ])
  const [newMessage, setNewMessage] = useState("")
  const [isTyping, setIsTyping] = useState(false)

  const handleSendMessage = () => {
    if (!newMessage.trim()) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      sender: "user",
      message: newMessage,
      timestamp: new Date().toLocaleTimeString(),
    }

    setChatMessages((prev) => [...prev, userMessage])
    setNewMessage("")
    setIsTyping(true)

    // Simulate agent response
    setTimeout(() => {
      const agentMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: "agent",
        message:
          "Thank you for your message. I'm looking into this for you. Is there anything specific about your booking or layover experience you'd like help with?",
        timestamp: new Date().toLocaleTimeString(),
      }
      setChatMessages((prev) => [...prev, agentMessage])
      setIsTyping(false)
    }, 2000)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <>
      {/* Support Options Card */}
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MessageCircle className="h-5 w-5" />
            <span>Customer Support</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Live Chat */}
            <div className="text-center space-y-4 p-6 border rounded-lg hover:bg-muted/50 transition-colors">
              <MessageCircle className="h-8 w-8 mx-auto text-primary" />
              <h3 className="font-semibold">Live Chat</h3>
              <p className="text-sm text-muted-foreground">
                Get instant help from our support team
              </p>
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                Available 24/7
              </Badge>
              <Button onClick={() => setIsChatOpen(true)} className="w-full">
                Start Chat
              </Button>
            </div>

            {/* Phone Support */}
            <div className="text-center space-y-4 p-6 border rounded-lg hover:bg-muted/50 transition-colors">
              <Phone className="h-8 w-8 mx-auto text-primary" />
              <h3 className="font-semibold">Phone Support</h3>
              <p className="text-sm text-muted-foreground">
                Speak directly with our travel experts
              </p>
              <div className="space-y-1">
                <p className="font-medium">+1 (555) 123-4567</p>
                <div className="flex items-center justify-center space-x-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>Mon-Sun 6AM-10PM EST</span>
                </div>
              </div>
              <Button variant="outline" className="w-full bg-transparent">
                Call Now
              </Button>
            </div>

            {/* Email Support */}
            <div className="text-center space-y-4 p-6 border rounded-lg hover:bg-muted/50 transition-colors">
              <Mail className="h-8 w-8 mx-auto text-primary" />
              <h3 className="font-semibold">Email Support</h3>
              <p className="text-sm text-muted-foreground">Send us a detailed message</p>
              <div className="space-y-1">
                <p className="font-medium">support@layoverhq.com</p>
                <p className="text-xs text-muted-foreground">Response within 2 hours</p>
              </div>
              <Button variant="outline" className="w-full bg-transparent">
                Send Email
              </Button>
            </div>
          </div>

          {/* Quick Help Topics */}
          <div className="mt-8 pt-6 border-t">
            <h3 className="font-semibold mb-4">Quick Help Topics</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {[
                "Booking Changes",
                "Cancellations",
                "Layover Experiences",
                "Payment Issues",
                "Travel Documents",
                "Flight Delays",
                "Refund Status",
                "Account Help",
              ].map((topic) => (
                <Button
                  key={topic}
                  variant="outline"
                  size="sm"
                  className="text-xs bg-transparent"
                  onClick={() => setIsChatOpen(true)}
                >
                  {topic}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Chat Widget */}
      {isChatOpen && (
        <div
          className={cn(
            "fixed bottom-4 right-4 w-80 bg-white border border-gray-200 rounded-lg shadow-xl z-50",
            isMinimized && "h-14",
          )}
        >
          {/* Chat Header */}
          <div className="flex items-center justify-between p-4 bg-primary text-white rounded-t-lg">
            <div className="flex items-center space-x-2">
              <MessageCircle className="h-4 w-4" />
              <span className="font-medium">LayoverHQ Support</span>
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
            </div>
            <div className="flex items-center space-x-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsMinimized(!isMinimized)}
                className="h-6 w-6 p-0 text-white hover:bg-white/20"
              >
                {isMinimized ? (
                  <Maximize2 className="h-3 w-3" />
                ) : (
                  <Minimize2 className="h-3 w-3" />
                )}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsChatOpen(false)}
                className="h-6 w-6 p-0 text-white hover:bg-white/20"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Chat Messages */}
              <div className="h-64 overflow-y-auto p-4 space-y-3">
                {chatMessages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      "flex",
                      message.sender === "user" ? "justify-end" : "justify-start",
                    )}
                  >
                    <div
                      className={cn(
                        "max-w-[80%] p-2 rounded-lg text-sm",
                        message.sender === "user"
                          ? "bg-primary text-white"
                          : "bg-gray-100 text-gray-900",
                      )}
                    >
                      <p>{message.message}</p>
                      <p
                        className={cn(
                          "text-xs mt-1",
                          message.sender === "user" ? "text-white/70" : "text-gray-500",
                        )}
                      >
                        {message.timestamp}
                      </p>
                    </div>
                  </div>
                ))}

                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 p-2 rounded-lg">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div
                          className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                          style={{ animationDelay: "0.1s" }}
                        ></div>
                        <div
                          className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                          style={{ animationDelay: "0.2s" }}
                        ></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Chat Input */}
              <div className="p-4 border-t">
                <div className="flex space-x-2">
                  <Input
                    placeholder="Type your message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="flex-1"
                  />
                  <Button size="sm" onClick={handleSendMessage} disabled={!newMessage.trim()}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Chat Bubble (when chat is closed) */}
      {!isChatOpen && (
        <Button
          onClick={() => setIsChatOpen(true)}
          className="fixed bottom-4 right-4 h-14 w-14 rounded-full shadow-lg z-50"
          size="lg"
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      )}
    </>
  )
}
