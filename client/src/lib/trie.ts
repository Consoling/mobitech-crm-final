/**
 * Trie (Prefix Tree) Data Structure for Efficient Brand Search
 * 
 * WHY TRIE?
 * - Time Complexity for search: O(m) where m = length of search term
 * - Space Complexity: O(n*m) where n = number of brands, m = avg brand name length
 * - Much faster than linear search O(n) for autocomplete
 * - Perfect for prefix matching (autocomplete scenarios)
 * 
 * EXAMPLE:
 * Brands: ["Apple", "Samsung", "Xiaomi"]
 * Search "app" -> Returns Apple in O(3) time instead of O(3*n) comparisons
 */

interface TrieNode {
  children: Map<string, TrieNode>;
  isEndOfWord: boolean;
  data: any; // Store the complete brand object
}

export class Trie {
  private root: TrieNode;

  constructor() {
    this.root = this.createNode();
  }

  /**
   * Creates a new Trie node
   * Time Complexity: O(1)
   */
  private createNode(): TrieNode {
    return {
      children: new Map(),
      isEndOfWord: false,
      data: null,
    };
  }

  /**
   * Insert a word into the Trie
   * Time Complexity: O(m) where m = length of word
   * Space Complexity: O(m) in worst case
   * 
   * @param word - The brand name to insert
   * @param data - The complete brand object
   */
  insert(word: string, data: any): void {
    if (!word) return;

    let node = this.root;
    const normalizedWord = word.toLowerCase(); // Case-insensitive search

    // Traverse/create path for each character
    for (const char of normalizedWord) {
      if (!node.children.has(char)) {
        node.children.set(char, this.createNode());
      }
      node = node.children.get(char)!;
    }

    node.isEndOfWord = true;
    node.data = data;
  }

  /**
   * Search for all words with given prefix
   * Time Complexity: O(m + k) where m = prefix length, k = results found
   * Space Complexity: O(k) for storing results
   * 
   * ALGORITHM:
   * 1. Traverse to prefix end: O(m)
   * 2. DFS to collect all words from that node: O(k)
   * 3. Return sorted results: O(k log k)
   * 
   * @param prefix - The search term
   * @returns Array of matching brand objects
   */
  search(prefix: string): any[] {
    if (!prefix) return [];

    const normalizedPrefix = prefix.toLowerCase();
    let node = this.root;

    // Step 1: Navigate to the prefix node - O(m)
    for (const char of normalizedPrefix) {
      if (!node.children.has(char)) {
        return []; // No matches found
      }
      node = node.children.get(char)!;
    }

    // Step 2: Collect all words with this prefix - O(k)
    const results: any[] = [];
    this.collectAllWords(node, results);

    return results;
  }

  /**
   * DFS to collect all complete words from a node
   * Time Complexity: O(k) where k = number of matching words
   * 
   * @param node - Starting node
   * @param results - Array to collect results
   */
  private collectAllWords(node: TrieNode, results: any[]): void {
    if (node.isEndOfWord && node.data) {
      results.push(node.data);
    }

    // Recursively traverse all children
    for (const child of node.children.values()) {
      this.collectAllWords(child, results);
    }
  }

  /**
   * Fuzzy search with tolerance for typos
   * Uses Levenshtein distance for approximate matching
   * Time Complexity: O(n*m*d) where d = max edit distance
   * 
   * @param prefix - Search term
   * @param maxDistance - Maximum edit distance allowed (default: 1)
   * @returns Array of matching brands with scores
   */
  fuzzySearch(prefix: string, maxDistance: number = 1): any[] {
    if (!prefix) return [];

    const normalizedPrefix = prefix.toLowerCase();
    const results: { data: any; score: number }[] = [];

    this.fuzzySearchHelper(
      this.root,
      "",
      normalizedPrefix,
      maxDistance,
      results
    );

    // Sort by score (lower is better)
    return results
      .sort((a, b) => a.score - b.score)
      .map(r => r.data);
  }

  /**
   * Helper for fuzzy search using dynamic programming
   */
  private fuzzySearchHelper(
    node: TrieNode,
    currentWord: string,
    target: string,
    maxDistance: number,
    results: { data: any; score: number }[]
  ): void {
    if (node.isEndOfWord && node.data) {
      const distance = this.levenshteinDistance(
        currentWord.substring(0, target.length),
        target
      );
      if (distance <= maxDistance) {
        results.push({ data: node.data, score: distance });
      }
    }

    // Prune branches that are too far
    if (currentWord.length > target.length + maxDistance) {
      return;
    }

    for (const [char, child] of node.children) {
      this.fuzzySearchHelper(
        child,
        currentWord + char,
        target,
        maxDistance,
        results
      );
    }
  }

  /**
   * Calculate Levenshtein distance between two strings
   * Time Complexity: O(m*n) using dynamic programming
   * 
   * @param str1 - First string
   * @param str2 - Second string
   * @returns Edit distance
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const m = str1.length;
    const n = str2.length;
    const dp: number[][] = Array(m + 1)
      .fill(null)
      .map(() => Array(n + 1).fill(0));

    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;

    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        if (str1[i - 1] === str2[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1];
        } else {
          dp[i][j] = Math.min(
            dp[i - 1][j] + 1,     // deletion
            dp[i][j - 1] + 1,     // insertion
            dp[i - 1][j - 1] + 1  // substitution
          );
        }
      }
    }

    return dp[m][n];
  }
}

/**
 * Create and populate Trie with brands
 * Call this once during app initialization
 * 
 * @param brands - Array of brand objects
 * @returns Populated Trie instance
 */
export function createBrandTrie(brands: any[]): Trie {
  const trie = new Trie();
  
  brands.forEach(brand => {
    // Insert by brand name
    trie.insert(brand.name, brand);
    
    // Also insert by brand ID for searching
    if (brand.id !== brand.name.toLowerCase()) {
      trie.insert(brand.id, brand);
    }
  });

  return trie;
}
