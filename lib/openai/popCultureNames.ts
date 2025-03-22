import OpenAI from 'openai';

// Initialize the OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
  // Removed Helicone proxy service - directly using OpenAI API
});

/**
 * Fetches popular baby names from pop culture using OpenAI
 * @param gender 'Male' | 'Female' - The gender to fetch names for
 * @returns Promise<string[]> - Array of names
 */
export async function getPopCultureNames(gender: 'Male' | 'Female'): Promise<string[]> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant that provides lists of names from popular culture."
        },
        {
          role: "user",
          content: `Please provide a list of 50 popular ${gender.toLowerCase()} names from movies, TV shows, books, and other popular culture. Return the response as a JSON array of strings. Include only the name without any additional information.`
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    const content = response.choices[0].message.content;

    if (!content) {
      console.error('No content returned from OpenAI API');
      return [];
    }

    try {
      const parsedContent = JSON.parse(content);

      // 确保返回的是数组
      if (Array.isArray(parsedContent.names)) {
        return parsedContent.names;
      } else if (Array.isArray(parsedContent)) {
        return parsedContent;
      } else {
        // 尝试从对象中提取名字数组
        const possibleArrays = Object.values(parsedContent).filter(val => Array.isArray(val));
        if (possibleArrays.length > 0) {
          return possibleArrays[0] as string[];
        }

        console.error('Unexpected response format:', parsedContent);
        return [];
      }
    } catch (parseError) {
      console.error('Error parsing OpenAI response:', parseError);
      console.error('Raw response:', content);
      return [];
    }
  } catch (error) {
    console.error('Error fetching pop culture names:', error);
    throw error;
  }
}