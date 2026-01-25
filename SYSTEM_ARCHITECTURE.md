# System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         USER INTERFACE                               │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │  SearchFilterBar Component                                      │ │
│  │  ┌──────────────┐                                              │ │
│  │  │ Input Field  │ ──┐                                          │ │
│  │  └──────────────┘   │                                          │ │
│  │         ▲            │                                          │ │
│  │         │            │                                          │ │
│  │         │            ▼                                          │ │
│  │    User Types   ┌─────────────┐                               │ │
│  │                 │  Debouncer   │ (300ms delay)                 │ │
│  │                 └─────────────┘                               │ │
│  │                        │                                        │ │
│  │                        ▼                                        │ │
│  │              ┌──────────────────┐                              │ │
│  │              │  Search Handler  │                              │ │
│  │              └──────────────────┘                              │ │
│  │                        │                                        │ │
│  │         ┌──────────────┴──────────────┐                       │ │
│  │         ▼                              ▼                        │ │
│  │  ┌─────────────┐             ┌──────────────────┐            │ │
│  │  │ Trie Search │             │   API Call       │            │ │
│  │  │ (Brands)    │             │  /models/search  │            │ │
│  │  │   O(m+k)    │             │   O(log n)       │            │ │
│  │  └─────────────┘             └──────────────────┘            │ │
│  │         │                              │                        │ │
│  │         └──────────────┬───────────────┘                       │ │
│  │                        ▼                                        │ │
│  │              ┌──────────────────┐                              │ │
│  │              │  Merge Results   │                              │ │
│  │              │  & Deduplicate   │                              │ │
│  │              └──────────────────┘                              │ │
│  │                        │                                        │ │
│  │                        ▼                                        │ │
│  │         ┌────────────────────────────┐                        │ │
│  │         │  AutocompleteDropdown      │                        │ │
│  │         │  ┌──────────────────────┐  │                        │ │
│  │         │  │ 📱 Brands            │  │                        │ │
│  │         │  │ ├─ Apple (logo)      │  │                        │ │
│  │         │  │ └─ Samsung (logo)    │  │                        │ │
│  │         │  ├──────────────────────┤  │                        │ │
│  │         │  │ 📱 Models            │  │                        │ │
│  │         │  │ ├─ iPhone 15 (img)   │  │                        │ │
│  │         │  │ └─ Galaxy S24 (img)  │  │                        │ │
│  │         │  ├──────────────────────┤  │                        │ │
│  │         │  │ 🔢 Model Codes       │  │                        │ │
│  │         │  │ └─ SM-S921B          │  │                        │ │
│  │         │  └──────────────────────┘  │                        │ │
│  │         └────────────────────────────┘                        │ │
│  └──────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                         BACKEND SERVER                               │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │  GET /models/search?q=samsung                                  │ │
│  │                                                                 │ │
│  │  ┌──────────────────────────────────────┐                     │ │
│  │  │  Query Parser & Validation           │                     │ │
│  │  └──────────────────────────────────────┘                     │ │
│  │                    │                                            │ │
│  │      ┌─────────────┴─────────────┐                            │ │
│  │      ▼                            ▼                             │ │
│  │ ┌─────────────┐          ┌─────────────────┐                 │ │
│  │ │Model Search │          │ Model Code      │                 │ │
│  │ │model: /^sam/│          │ Search          │                 │ │
│  │ │  (indexed)  │          │ modelCodes:     │                 │ │
│  │ └─────────────┘          │ {$regex: /sam/} │                 │ │
│  │      │                   └─────────────────┘                 │ │
│  │      │                            │                            │ │
│  │      └────────────┬───────────────┘                           │ │
│  │                   ▼                                            │ │
│  │          ┌─────────────────┐                                  │ │
│  │          │ Result Processor │                                  │ │
│  │          │ - Limit results  │                                  │ │
│  │          │ - Format data    │                                  │ │
│  │          └─────────────────┘                                  │ │
│  │                   │                                            │ │
│  │                   ▼                                            │ │
│  │          ┌─────────────────┐                                  │ │
│  │          │  JSON Response   │                                  │ │
│  │          └─────────────────┘                                  │ │
│  └────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                         DATABASE LAYER                               │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │  MongoDB - devices Collection                                  │ │
│  │                                                                 │ │
│  │  Indexes:                                                       │ │
│  │  ┌─────────────────────────────────────┐                      │ │
│  │  │ { model: 1 }          B-Tree Index  │ ← O(log n) lookup   │ │
│  │  │ { modelCodes: 1 }     B-Tree Index  │ ← O(log n) lookup   │ │
│  │  │ { brand: 1 }          B-Tree Index  │ ← O(log n) lookup   │ │
│  │  └─────────────────────────────────────┘                      │ │
│  │                                                                 │ │
│  │  Sample Document:                                              │ │
│  │  {                                                              │ │
│  │    smc: "SAM-XYZ-123",                                         │ │
│  │    brand: "samsung",                                           │ │
│  │    model: "Galaxy S24",                                        │ │
│  │    imageUrl: "https://...",                                    │ │
│  │    modelCodes: ["SM-S921B", "SM-S921U"]                       │ │
│  │  }                                                              │ │
│  └────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                      TRIE DATA STRUCTURE                             │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │  In-Memory Brand Trie (Client-side)                            │ │
│  │                                                                 │ │
│  │                       root                                      │ │
│  │                    /   |   \                                   │ │
│  │                   a    s    x                                   │ │
│  │                   |    |    |                                   │ │
│  │                   p    a    i                                   │ │
│  │                   |    |    |                                   │ │
│  │                   p    m    a                                   │ │
│  │                   |    |    |                                   │ │
│  │                   l    s    o                                   │ │
│  │                   |    |    |                                   │ │
│  │                   e    u    m                                   │ │
│  │                   *    |    |                                   │ │
│  │                 (Apple) n   i                                   │ │
│  │                        |    *                                   │ │
│  │                        g  (Xiaomi)                              │ │
│  │                        *                                        │ │
│  │                    (Samsung)                                    │ │
│  │                                                                 │ │
│  │  * = End of word marker with brand data                        │ │
│  └────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                     PERFORMANCE TIMELINE                             │
│                                                                      │
│  User types "s" ────────────────────────────────────────────────   │
│       │                                                              │
│       ├─ 0ms: Keystroke captured                                    │
│       ├─ 0-300ms: Debounce waiting...                              │
│       ├─ 300ms: Debounce timeout, trigger search                   │
│       │                                                              │
│       ├─ 300ms: [Parallel Execution Start]                         │
│       │   ├─ Thread 1: Trie.search("s")                            │
│       │   │   └─ 305ms: Returns ["Samsung"] (5ms)                  │
│       │   │                                                          │
│       │   └─ Thread 2: API call /models/search?q=s                 │
│       │       ├─ 305ms: Request sent                               │
│       │       ├─ 310ms: DB query executed (indexed)                │
│       │       └─ 320ms: Response received (20ms)                   │
│       │                                                              │
│       ├─ 325ms: Merge results                                      │
│       ├─ 326ms: Render dropdown                                    │
│       └─ 330ms: User sees results                                  │
│                                                                      │
│  Total perceived latency: 30ms (imperceptible!) ⚡                 │
└─────────────────────────────────────────────────────────────────────┘
```

## Complexity Analysis Summary

### Time Complexity:
- **Trie Search**: O(m + k) where m = search length, k = results
- **DB Query**: O(log n) where n = total documents (due to indexing)
- **Debounce**: O(1) constant time operation
- **Merge**: O(k) linear in results
- **Total**: O(m + k + log n) ≈ **O(log n)** for large datasets

### Space Complexity:
- **Trie**: O(n*m) where n = brands (16), m = avg length (6) = ~100 nodes
- **Results Cache**: O(k) where k ≤ 20 results
- **Total**: O(n*m + k) ≈ **O(1)** constant for small dataset

## API Call Reduction

```
Scenario: User types "samsung" (7 characters)

Without Debounce:
├─ Keystroke 1: 's'      → API call 1
├─ Keystroke 2: 'sa'     → API call 2
├─ Keystroke 3: 'sam'    → API call 3
├─ Keystroke 4: 'sams'   → API call 4
├─ Keystroke 5: 'samsu'  → API call 5
├─ Keystroke 6: 'samsun' → API call 6
└─ Keystroke 7: 'samsung'→ API call 7
Total: 7 API calls

With Debounce (300ms):
├─ Keystroke 1-7: Typing...
└─ 300ms after last: 'samsung' → API call 1
Total: 1 API call

Savings: 85.7% reduction! 💰
```
