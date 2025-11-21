#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <stdbool.h>

#define MAX_LINE_LENGTH 10000
#define MAX_WORD_LENGTH 100
#define MAX_HSK_LEVELS 7
#define MAX_TOCFL_LEVELS 5

typedef struct {
    char word[MAX_WORD_LENGTH];
} Word;

typedef struct {
    Word *words;
    int count;
    int capacity;
} WordList;

WordList* create_wordlist() {
    WordList *list = malloc(sizeof(WordList));
    list->capacity = 10000;
    list->words = malloc(sizeof(Word) * list->capacity);
    list->count = 0;
    return list;
}

void add_word(WordList *list, const char *word) {
    if (list->count >= list->capacity) {
        list->capacity *= 2;
        list->words = realloc(list->words, sizeof(Word) * list->capacity);
    }
    strncpy(list->words[list->count].word, word, MAX_WORD_LENGTH - 1);
    list->words[list->count].word[MAX_WORD_LENGTH - 1] = '\0';
    list->count++;
}

// Get UTF-8 character length
int get_utf8_char_len(const unsigned char *s) {
    if ((s[0] & 0x80) == 0x00) return 1;
    if ((s[0] & 0xE0) == 0xC0) return 2;
    if ((s[0] & 0xF0) == 0xE0) return 3;
    if ((s[0] & 0xF8) == 0xF0) return 4;
    return 1;
}

// Check if character is Chinese
bool is_chinese_char(const unsigned char *s) {
    if (get_utf8_char_len(s) == 3) {
        if (s[0] >= 0xE4 && s[0] <= 0xE9) {
            return true;
        }
    }
    return false;
}

// Check if word exists in vocabulary
bool word_exists(WordList *vocab, const char *word) {
    for (int i = 0; i < vocab->count; i++) {
        if (strcmp(vocab->words[i].word, word) == 0) {
            return true;
        }
    }
    return false;
}

// Try to segment sentence using vocabulary up to max_level
bool can_segment_with_level(const char *sentence, WordList *vocabs[], int max_level) {
    int len = strlen(sentence);
    if (len == 0) return true;
    
    int pos = 0;
    
    while (pos < len) {
        // Skip non-Chinese characters
        if (!is_chinese_char((unsigned char*)(sentence + pos))) {
            pos += get_utf8_char_len((unsigned char*)(sentence + pos));
            continue;
        }
        
        bool found_match = false;
        int best_match_len = 0;
        
        // Try to find longest matching word (greedy approach)
        int max_check = (len - pos < MAX_WORD_LENGTH) ? len - pos : MAX_WORD_LENGTH - 1;
        
        for (int check_len = max_check; check_len >= 3; check_len--) {
            char candidate[MAX_WORD_LENGTH];
            strncpy(candidate, sentence + pos, check_len);
            candidate[check_len] = '\0';
            
            // Check if word exists in any vocab from level 0 to max_level-1
            for (int level = 0; level < max_level; level++) {
                if (word_exists(vocabs[level], candidate)) {
                    found_match = true;
                    best_match_len = check_len;
                    break;
                }
            }
            if (found_match) break;
        }
        
        // If no multi-char match, try single character
        if (!found_match) {
            int char_len = get_utf8_char_len((unsigned char*)(sentence + pos));
            char single_char[5] = {0};
            strncpy(single_char, sentence + pos, char_len);
            
            for (int level = 0; level < max_level; level++) {
                if (word_exists(vocabs[level], single_char)) {
                    found_match = true;
                    best_match_len = char_len;
                    break;
                }
            }
        }
        
        if (!found_match) {
            return false;
        }
        
        pos += best_match_len;
    }
    
    return true;
}

// Find lowest HSK level that can segment the sentence
int find_hsk_level(const char *sentence, WordList *hsk_vocabs[]) {
    for (int level = 1; level <= MAX_HSK_LEVELS; level++) {
        if (can_segment_with_level(sentence, hsk_vocabs, level)) {
            return level;
        }
    }
    return 0;
}

// Find lowest TOCFL level that can segment the sentence
int find_tocfl_level(const char *sentence, WordList *tocfl_vocabs[]) {
    for (int level = 1; level <= MAX_TOCFL_LEVELS; level++) {
        if (can_segment_with_level(sentence, tocfl_vocabs, level)) {
            return level;
        }
    }
    return 0;
}

// Load CSV
void load_csv(const char *filename, WordList *list) {
    FILE *file = fopen(filename, "r");
    if (!file) {
        printf("Warning: Could not open %s\n", filename);
        return;
    }
    
    char line[MAX_LINE_LENGTH];
    fgets(line, sizeof(line), file); // Skip header
    
    while (fgets(line, sizeof(line), file)) {
        // Parse CSV: simplified,char_count
        char *comma = strchr(line, ',');
        if (comma) {
            *comma = '\0';
            add_word(list, line);
        }
    }
    fclose(file);
}

int main() {
    printf("Loading vocabularies...\n\n");
    
    // Create HSK vocabulary lists
    WordList *hsk_vocabs[MAX_HSK_LEVELS];
    for (int i = 0; i < MAX_HSK_LEVELS; i++) {
        hsk_vocabs[i] = create_wordlist();
    }
    
    printf("HSK:\n");
    for (int i = 1; i <= MAX_HSK_LEVELS; i++) {
        char filename[256];
        snprintf(filename, sizeof(filename), "vocabCsv/hsk_level%d_sorted.csv", i);
        load_csv(filename, hsk_vocabs[i-1]);
        printf("  Level %d: %d words\n", i, hsk_vocabs[i-1]->count);
    }
    
    int total_hsk = 0;
    for (int i = 0; i < MAX_HSK_LEVELS; i++) {
        total_hsk += hsk_vocabs[i]->count;
    }
    printf("  Total: %d words\n\n", total_hsk);
    
    // Create TOCFL vocabulary lists
    WordList *tocfl_vocabs[MAX_TOCFL_LEVELS];
    for (int i = 0; i < MAX_TOCFL_LEVELS; i++) {
        tocfl_vocabs[i] = create_wordlist();
    }
    
    printf("TOCFL:\n");
    for (int i = 1; i <= MAX_TOCFL_LEVELS; i++) {
        char filename[256];
        snprintf(filename, sizeof(filename), "vocabCsv/tocfl_level%d_sorted.csv", i);
        load_csv(filename, tocfl_vocabs[i-1]);
        printf("  Level %d: %d words\n", i, tocfl_vocabs[i-1]->count);
    }
    
    int total_tocfl = 0;
    for (int i = 0; i < MAX_TOCFL_LEVELS; i++) {
        total_tocfl += tocfl_vocabs[i]->count;
    }
    printf("  Total: %d words\n\n", total_tocfl);
    
    printf("Processing sentences...\n");
    FILE *input = fopen("vocabCsv/sentences.csv", "r");
    FILE *output = fopen("vocabCsv/sentences_temp.csv", "w");
    
    if (!input || !output) {
        printf("Error opening files\n");
        return 1;
    }
    
    char line[MAX_LINE_LENGTH];
    
    // Read and write header
    if (fgets(line, sizeof(line), input)) {
        char *newline = strchr(line, '\n');
        if (newline) *newline = '\0';
        newline = strchr(line, '\r');
        if (newline) *newline = '\0';
        
        // Remove existing level columns if they exist
        char *hsk_pos = strstr(line, ",HSK Level");
        char *tocfl_pos = strstr(line, ",TOCFL Level");
        if (hsk_pos) *hsk_pos = '\0';
        else if (tocfl_pos) *tocfl_pos = '\0';
        
        fprintf(output, "%s,HSK Level,TOCFL Level\n", line);
    }
    
    int total_count = 0;
    int hsk_counts[8] = {0}; // 0-7
    int tocfl_counts[6] = {0}; // 0-5
    
    while (fgets(line, sizeof(line), input)) {
        char sentence[MAX_LINE_LENGTH];
        char pinyin[MAX_LINE_LENGTH];
        char meaning[MAX_LINE_LENGTH];
        
        // Remove newline
        char *newline = strchr(line, '\n');
        if (newline) *newline = '\0';
        newline = strchr(line, '\r');
        if (newline) *newline = '\0';
        
        // Parse CSV properly handling quotes and commas in fields
        char *ptr = line;
        int field_num = 0;
        char *fields[5] = {NULL};
        
        while (*ptr && field_num < 5) {
            // Skip leading spaces
            while (*ptr == ' ') ptr++;
            
            char *field_start = ptr;
            bool in_quotes = false;
            
            // If field starts with quote, handle quoted field
            if (*ptr == '"') {
                in_quotes = true;
                ptr++;
                field_start = ptr;
                // Find closing quote
                while (*ptr && !(*ptr == '"' && *(ptr+1) != '"')) {
                    if (*ptr == '"' && *(ptr+1) == '"') ptr += 2; // Handle escaped quotes
                    else ptr++;
                }
                if (*ptr == '"') {
                    *ptr = '\0';
                    ptr++;
                    if (*ptr == ',') ptr++;
                }
            } else {
                // Regular unquoted field - find next comma
                while (*ptr && *ptr != ',') ptr++;
                if (*ptr == ',') {
                    *ptr = '\0';
                    ptr++;
                }
            }
            
            fields[field_num++] = field_start;
        }
        
        if (field_num < 3) continue; // Need at least Characters, Pinyin, Meaning
        
        strncpy(sentence, fields[0], MAX_LINE_LENGTH - 1);
        strncpy(pinyin, fields[1], MAX_LINE_LENGTH - 1);
        strncpy(meaning, fields[2], MAX_LINE_LENGTH - 1);
        
        int hsk_level = find_hsk_level(sentence, hsk_vocabs);
        int tocfl_level = find_tocfl_level(sentence, tocfl_vocabs);
        
        hsk_counts[hsk_level]++;
        tocfl_counts[tocfl_level]++;
        
        // Output with proper CSV escaping for meaning field (in case it has commas)
        bool meaning_has_comma = strchr(meaning, ',') != NULL;
        if (meaning_has_comma) {
            fprintf(output, "%s,%s,\"%s\",%d,%d\n", sentence, pinyin, meaning, hsk_level, tocfl_level);
        } else {
            fprintf(output, "%s,%s,%s,%d,%d\n", sentence, pinyin, meaning, hsk_level, tocfl_level);
        }

        
        total_count++;
        if (total_count % 500 == 0) {
            float progress = (float)total_count / 18896 * 100;
            printf("\r[");
            int bar_width = 40;
            int filled = (int)(progress / 100 * bar_width);
            for (int i = 0; i < bar_width; i++) {
                if (i < filled) printf("=");
                else if (i == filled) printf(">");
                else printf(" ");
            }
            printf("] %5.1f%% (%d/%d)", progress, total_count, 18896);
            fflush(stdout);
        }
    }
    
    printf("\r[========================================] 100.0%% (%d/%d)\n", 
           total_count, total_count);
    
    fclose(input);
    fclose(output);
    
    // Replace original file
    remove("vocabCsv/sentences.csv");
    rename("vocabCsv/sentences_temp.csv", "vocabCsv/sentences.csv");
    
    printf("\n");
    printf("========================================================\n");
    printf("HSK LEVEL BREAKDOWN (Bottom-Up)\n");
    printf("========================================================\n");
    printf("No level:      %5d sentences (%5.2f%%)\n", 
           hsk_counts[0], (float)hsk_counts[0] / total_count * 100);
    for (int i = 1; i <= MAX_HSK_LEVELS; i++) {
        printf("Level %d:       %5d sentences (%5.2f%%)\n", 
               i, hsk_counts[i], (float)hsk_counts[i] / total_count * 100);
    }
    printf("--------------------------------------------------------\n");
    printf("Total:         %5d sentences\n", total_count);
    
    printf("\n");
    printf("========================================================\n");
    printf("TOCFL LEVEL BREAKDOWN (Bottom-Up)\n");
    printf("========================================================\n");
    printf("No level:      %5d sentences (%5.2f%%)\n", 
           tocfl_counts[0], (float)tocfl_counts[0] / total_count * 100);
    for (int i = 1; i <= MAX_TOCFL_LEVELS; i++) {
        printf("Level %d:       %5d sentences (%5.2f%%)\n", 
               i, tocfl_counts[i], (float)tocfl_counts[i] / total_count * 100);
    }
    printf("--------------------------------------------------------\n");
    printf("Total:         %5d sentences\n", total_count);
    
    printf("\nNote: Sentences assigned to LOWEST level that can\n");
    printf("      segment all words in the sentence.\n");
    
    // Cleanup
    for (int i = 0; i < MAX_HSK_LEVELS; i++) {
        free(hsk_vocabs[i]->words);
        free(hsk_vocabs[i]);
    }
    for (int i = 0; i < MAX_TOCFL_LEVELS; i++) {
        free(tocfl_vocabs[i]->words);
        free(tocfl_vocabs[i]);
    }
    
    return 0;
}

