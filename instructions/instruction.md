# Product Requirements Document (PRD)

## 1. Project Overview

We are building a Next.js 14 web application (with Tailwind CSS and Shadcn UI components) that recommends baby names to users based on:

1. Gender (Male or Female)
2. Meaning or Theme (e.g. "Love", "Peace", "Harmony", etc.)
3. Chinese Metaphysics (e.g., BaZi (Four Pillars), Qi Men Dun Jia, Feng Shui, Name Analysis)

**Additional contexts:**

- We will use the SSA (Social Security Administration) local dataset to fetch popular baby names.
- We will use the OpenAI API in two ways:
  - (a) to fetch additional top baby names from pop culture
  - (b) to filter and analyze the final results based on the user's meaning/theme and metaphysics criteria

The user will also be able to save favorite names in a separate list and view details about each name.

## 2. Tech Stack

- Next.js 14: Routing (App Router) and server actions
- Tailwind CSS: Primary styling solution
- Shadcn: UI components
- Lucide icons: Icon set
- OpenAI API: For name generation, filtering, and structured analysis
- Local SSA Data: For initial baby name list

## 3. Core Functionalities

### 3.1 Name Search Page (/search)

1. **Form fields**
   - Gender: Dropdown/Radio (Male or Female)
   - Meaning or Theme: Text input (e.g. "Love", "Peace", "Harmony")
   - Chinese Metaphysics: Dropdown or multi-select options (e.g. "BaZi", "Qi Men Dun Jia", "Feng Shui", "Name Analysis")

2. **Logic**
   - Step A: Fetch the top 500 popular baby names from the local SSA data files, filtered by the user's selected gender.
   - Step B: Fetch up to 500 popular baby names using the OpenAI API (pop culture references). Example prompt structure:

     ```
     "Compiling a list of the top 500 most popular first names from iconic characters in classic movies, books, and music. The gender is: <gender>"
     ```

   - Step C: Merge both lists; remove duplicates.
   - Step D: Filter the final merged list using the OpenAI API based on the user's "meaning/theme" and "Chinese metaphysics" criteria. Example prompt:

     ```
     "Filter the names based on the following meaning or theme, Chinese Metaphysics criteria: <meaningTheme>, <chineseMetaphysics>"
     ```

   - Step E: Once filtered, we display the final list of names to the user.

3. **UI**
   - Form submission triggers the fetch and filtering.
   - Results are displayed with minimal data (e.g. name, rank). Each name is clickable.
   - Allow user to save names to the favorite list.

### 3.2 Favorite List Page (/favorites)

- Shows all names list saved by the user.
- Toggle a favorite name to explain its details.
- Allows user to remove names from the list.

### 3.3 Direct Name Analysis (/analyze)

1. **Form fields**
   - Name: Text input for the specific name to analyze
   - Chinese Translation: Text input for the Chinese translation of the name
   - Gender: Dropdown/Radio (Male or Female)
   - Meaning or Theme: Text input (e.g. "Love", "Peace", "Harmony")
   - Chinese Metaphysics: Dropdown or multi-select options (e.g. "BaZi", "Qi Men Dun Jia", "Feng Shui", "Name Analysis")

2. **Logic**
   - User enters a specific name they want to analyze
   - User specifies the gender and criteria for analysis
   - The application uses the existing name analysis functionality to generate an analysis for just that specific name
   - The results include detailed information across all analysis categories (Character Analysis, BaZi Analysis, etc.)

3. **UI**
   - Simple form with input for the name and the same criteria options as the search page
   - Results display similar to the name details page, showing comprehensive analysis
   - Option to save the analyzed name to favorites
   - Clear indication of how well the name matches the provided criteria

4. **Implementation**
   - Reuse the existing `analyzeNameMatch` function from the name analysis service
   - Leverage the existing API endpoint structure, particularly `/api/name-analysis`
   - Utilize the existing caching mechanism to prevent duplicate analyses
   - Display results in a format similar to the name details page

## 4. Implementation Details

### 4.1 Using Local SSA Data

We have a helper function to retrieve popular baby names for a given year and gender. A simplified version is shown below for context (this snippet is provided in the documentation—do not store it in the final code exactly like this; it's purely for reference):

```javascript
/**
 * Gets popular baby names from local data files
 * @param {number} year - The year to fetch data for
 * @param {number} limit - Number of top names to retrieve
 * @returns {Promise<Array>} - Array of popular baby names with rankings
 */
export async function getPopularBabyNamesFromFiles(year = null, limit = 1000) {
  try {
    // If no year specified, use the most recent available
    const currentYear = new Date().getFullYear();
    const targetYear = year || currentYear - 1;

    // Path to the data directory
    // e.g., '/Users/miajia/Documents/personal/ai project/data/names/'
    // Construct the filename like "yob2022.txt"

    // Parse the file and filter by gender
    // Return top 'limit' names sorted by count
  } catch (error) {
    console.error('Error fetching baby names from files:', error);
    throw error;
  }
}
```

> Note: The developer should adapt this to the final data structure and path in the production environment. The above snippet simply outlines logic for reading local SSA files.

### 4.2 Using OpenAI API

There are two main points where OpenAI is leveraged:

1. **Fetching Additional Names**

   We prompt OpenAI to generate/populate additional popular names from iconic characters:

   ```
   "Compiling a list of the top 500 most popular first names from iconic characters in classic movies, books, and music. The gender is: <gender>"
   ```

   - The service merges these with the local SSA data results, removing duplicates.

2. **Filtering and Analysis**

   After merging, we send the entire set (or relevant subset) to OpenAI with instructions to filter or analyze them. We also rely on structured output to determine each name's alignment with the user's criteria.

#### Structured Output Analysis

Below is a conceptual example (not final code) demonstrating how we might prompt OpenAI for structured output using a hypothetical analyzeNameMatch function:

```javascript
/**
 * Analyzes a name based on user criteria using OpenAI's structured output
 * @param name - The baby name to analyze
 * @param gender - 'Male' | 'Female'
 * @param meaningTheme - The user's desired meaning/theme
 * @param chineseMetaphysics - The user's Chinese metaphysics criteria
 * @returns Promise<NameMatchAnalysis> - A structured analysis result
 */
export async function analyzeNameMatch(name, gender, meaningTheme, chineseMetaphysics) {
  // Example prompt:
  // "Analyze the name "Alice" (Female) based on these criteria:
  //  - Meaning/Theme: Love
  //  - Chinese Metaphysics: BaZi
  //
  // Provide a structured JSON response with your analysis."

  // Potential categories: "Character Analysis", "Bazi Analysis", "Qi Men Dun Jia Analysis", "Feng Shui Analysis", "Name Analysis"
}
```

Example response from the AI (simplified JSON snippet):

```json
{
  "name": "Alice",
  "gender": "Female",
  "analysis": {
    "characterAnalysis": "Alice is historically known from Alice in Wonderland...",
    "baziAnalysis": "In BaZi, the name might align with Yin Fire if the day master is ...",
    "qiMenDunJiaAnalysis": "...",
    "fengShuiAnalysis": "...",
    "nameAnalysis": "Overall meaning ties to 'nobility' in some contexts..."
  },
  "matchScore": 8.5
}
```

The developer will parse and store this for the Name Detail Page or further filtering logic.

## 5. Proposed File Structure

To keep the codebase minimal yet well-organized, we recommend the following layout. This ensures fewer files while preserving clarity:

```
baby-name-app/
├── app/
│   ├── layout.tsx
│   ├── globals.css
│   ├── page.tsx
│   ├── search/
│   │   └── page.tsx
│   ├── name/
│   │   └── [name]/
│   │       └── page.tsx
│   ├── analyze/
│   │   └── page.tsx           // for direct name analysis
│   └── api/
│       ├── baby-names/
│       │   └── route.ts       // for merging & returning names
│       └── name-analysis/
│           └── route.ts       // for performing structured analysis
├── components/
│   ├── Navigation.tsx
│   ├── NameCard.tsx
│   ├── SearchForm.tsx
│   └── ui/
│       ├── button.tsx
│       └── card.tsx
├── lib/
│   ├── ssaData.ts             // previously fetchSSAData.ts
│   ├── nameAnalysis.ts        // previously nameAnalysis.ts
│   └── openaiClient.ts        // (optional) central OpenAI logic
├── types/
│   └── index.ts               // merges all type definitions
├── README.md
├── next.config.mjs
├── package.json
├── tailwind.config.js
├── postcss.config.js
└── tsconfig.json
```

**Key Notes on This Structure**

- **app/**: Houses Next.js pages (or "routes") and API routes.
- **components/**: Reusable UI components.
  - Navigation.tsx, NameCard.tsx, and SearchForm.tsx are the primary high-level UI blocks.
  - A ui/ subfolder can hold small reusable elements like buttons, cards, etc.
- **lib/**: Core business logic (fetching data, calling OpenAI, analyzing results).
- **types/**: All TypeScript interfaces and types, consolidated into an index.ts for simplicity.

## 6. Testing and Validation

1. **Manual Testing**
   - Submit various queries on the Search page (e.g., "Male, Love, BaZi") and confirm that the combined results are correct.
2. **OpenAI Response Handling**
   - Verify that if OpenAI fails (or times out), a fallback or error message is displayed.
3. **Favorites**
   - Confirm names can be added/removed from the favorite list and that re-visiting the app maintains the saved data (depending on local storage or user accounts).

## 7. Documentation References

### 7.1 Local SSA Data Code Snippet

```javascript
/**
 * getPopularBabyNamesFromFiles
 *
 * - read local SSA .txt files (e.g., "yob2022.txt")
 * - parse CSV content: name,gender,count
 * - filter by gender, sort by popularity, return limit
 */
```

(Complete snippet provided above in section 4.1. Developer can adapt to real file paths.)

### 7.2 Name Analysis Code Snippet

```javascript
/**
 * analyzeNameMatch
 *
 * Uses OpenAI's structured output to categorize a name
 * into relevant categories, e.g.:
 *   - Character Analysis
 *   - BaZi Analysis
 *   - Qi Men Dun Jia Analysis
 *   - Feng Shui Analysis
 *   - Name Analysis
 *
 * Returns a structured JSON with a match score and reasoning.
 */
```

(Complete snippet provided above in section 4.2. Developer can adapt to real environment.)

### 7.3 Example OpenAI Response

```json
{
  "name": "Alice",
  "gender": "Female",
  "analysis": {
    "characterAnalysis": "...",
    "baziAnalysis": "...",
    "qiMenDunJiaAnalysis": "...",
    "fengShuiAnalysis": "...",
    "nameAnalysis": "..."
  },
  "matchScore": 8.5
}
```

## 8. Acceptance Criteria

1. **Search Flow**
   - User can specify gender, meaning/theme, Chinese metaphysics.
   - System returns a combined list of names from local SSA + OpenAI pop culture references, with duplicates removed.
   - Names are properly filtered by user's criteria.
2. **Name Detail**
   - Clicking a name shows structured analysis from OpenAI.
3. **Favorites Management**
   - User can add and remove names from favorites.
   - A dedicated Favorites Page shows the saved list.
4. **Minimal File Structure**
   - Project is set up according to the recommended structure or something similarly minimal/organized.
5. **Documentation**
   - The final code references (where relevant) the snippet logic for fetching SSA data and analyzing names with OpenAI.
6. **Direct Name Analysis**
   - User can input a specific name and criteria
   - System returns a comprehensive analysis of the name
   - Analysis results match the format of the name details page
   - User can save the analyzed name to favorites
