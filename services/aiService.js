const { GoogleGenerativeAI } = require('@google/generative-ai');
const config = require("../config/config");
const NexusEvent = require("../models/NexusEvent");
const Variant = require("../models/Variant");

// Initialize Google AI
const genAI = new GoogleGenerativeAI(config.googleApiKey);

// Initialize the model
const model = genAI.getGenerativeModel({ model: config.aiConfig.model });

// System prompt for Miss Minutes
const systemPrompt = `You are Miss Minutes, the Time Variance Authority's AI assistant. You have the following characteristics:

1. Personality:
- Southern accent and folksy manner of speaking
- Friendly and helpful demeanor
- Professional but approachable
- Uses phrases like "y'all", "reckon", "ain't", "fixin' to"

2. Knowledge:
- Deep understanding of TVA operations
- Timeline management and variant tracking
- TVA protocols and procedures
- Historical timeline events
- Variant types and classifications
- Access to real-time database information about:
  * Nexus Events (timeline disruptions)
  * Variants (timeline criminals and anomalies)

3. Behavior:
- Always maintains TVA's authority and importance
- Provides accurate information about timeline events
- Explains complex TVA concepts in simple terms
- Uses analogies and examples to explain timeline concepts
- Can query the database for real-time information about:
  * Current active variants
  * Recent nexus events
  * Timeline disruptions
  * Variant status and locations

4. Response Style:
- Starts responses with southern-style phrases
- Maintains a helpful and informative tone
- Uses TVA-specific terminology appropriately
- Provides context for timeline-related information
- Incorporates real-time database information when relevant

5. Database Query Capabilities:
- Can provide information about:
  * Active variants and their locations
  * Recent nexus events and their impact
  * Timeline disruptions and their status
  * Variant threat levels and containment status
  * Timeline casualties and resolution status`;

const responsePrefixes = [
  "Well, let me tell y'all about that...",
  "Now, that's an interesting question about the timeline...",
  "I reckon I can help you with that...",
  "Let me check the TVA records for you...",
  "According to our timeline protocols...",
  "Bless your heart, let me explain that...",
  "Now, sugar, here's what you need to know...",
  "Let me break that down for y'all..."
];

class AIService {
  static async queryDatabase(queryType, params = {}) {
    try {
      switch (queryType) {
        case 'activeVariants':
          return await Variant.find({ status: 'Active' });
        case 'recentNexusEvents':
          return await NexusEvent.find().sort({ date: -1 }).limit(5);
        case 'highThreatVariants':
          return await Variant.find({ threatLevel: 'High' });
        case 'criticalNexusEvents':
          return await NexusEvent.find({ impact: 'Critical' });
        case 'variantByTimeline':
          return await Variant.find({ timeline: params.timeline });
        case 'nexusEventsByImpact':
          return await NexusEvent.find({ impact: params.impact });
        case 'variantByName':
          return await Variant.findOne({ name: { $regex: new RegExp(params.name, 'i') } });
        default:
          return null;
      }
    } catch (error) {
      console.error('Database query error:', error);
      throw error;
    }
  }

  static async generateResponse(message, history) {
    try {
      // Prepare the chat history
      const chat = model.startChat({
        history: history.map(msg => ({
          role: msg.role,
          parts: msg.content,
        })),
        generationConfig: {
          temperature: config.aiConfig.temperature,
          topK: config.aiConfig.topK,
          topP: config.aiConfig.topP,
          maxOutputTokens: config.aiConfig.maxOutputTokens,
        },
      });

      // Send message and get response
      const result = await chat.sendMessage(message);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('AI Service Error:', error);
      throw error;
    }
  }

  static async determineDatabaseQuery(message) {
    const messageLower = message.toLowerCase();
    
    // Check for direct variant name queries
    const variantNameMatch = message.match(/(?:tell me about|who is|what is|show me|information about)\s+([^.,!?]+)/i);
    if (variantNameMatch) {
      const potentialVariantName = variantNameMatch[1].trim();
      if (potentialVariantName.length > 2) { // Basic validation to avoid false positives
        return { 
          shouldQuery: true, 
          queryType: 'variantByName', 
          params: { name: potentialVariantName }
        };
      }
    }

    // Check for variant-related queries
    if (messageLower.includes('variant') || messageLower.includes('criminal')) {
      if (messageLower.includes('active')) {
        return { shouldQuery: true, queryType: 'activeVariants' };
      }
      if (messageLower.includes('high threat') || messageLower.includes('dangerous')) {
        return { shouldQuery: true, queryType: 'highThreatVariants' };
      }
      if (messageLower.includes('timeline')) {
        const timeline = message.match(/timeline\s+([^.,!?]+)/i)?.[1];
        if (timeline) {
          return { shouldQuery: true, queryType: 'variantByTimeline', params: { timeline } };
        }
      }
    }

    // Check for nexus event-related queries
    if (messageLower.includes('nexus') || messageLower.includes('event') || messageLower.includes('disruption')) {
      if (messageLower.includes('recent')) {
        return { shouldQuery: true, queryType: 'recentNexusEvents' };
      }
      if (messageLower.includes('critical')) {
        return { shouldQuery: true, queryType: 'criticalNexusEvents' };
      }
      if (messageLower.includes('impact')) {
        const impact = message.match(/impact\s+([^.,!?]+)/i)?.[1];
        if (impact) {
          return { shouldQuery: true, queryType: 'nexusEventsByImpact', params: { impact } };
        }
      }
    }

    return { shouldQuery: false };
  }
}

module.exports = AIService; 