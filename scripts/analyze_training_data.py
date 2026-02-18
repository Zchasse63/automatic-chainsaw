#!/usr/bin/env python3
"""Analyze training data JSONL for composition, categories, and coverage gaps."""

import json
import re
from collections import defaultdict, Counter

JSONL_PATH = "/Users/zach/Desktop/hyrox-ai-coach/docs/training-data/combined/all.jsonl"

# Category keywords (order matters — first match wins for primary category)
CATEGORIES = {
    "Equipment/Shoes": [
        r"\bshoe[s]?\b", r"\bfootwear\b", r"\binsole[s]?\b", r"\bequipment\b",
        r"\bgear\b", r"\bglove[s]?\b", r"\bbelt\b", r"\bwrist.?wrap", r"\bknee.?sleeve",
        r"\bgrip[s]?\b", r"\bstrap[s]?\b", r"\bclothing\b", r"\bwhat.+wear\b",
        r"\brace.?vest\b", r"\bheart.?rate.?monitor\b", r"\bwatch\b", r"\bgarmin\b",
        r"\bwhoop\b", r"\bpolar\b",
    ],
    "Doubles/Team Format": [
        r"\bdouble[s]?\b", r"\bteam\b", r"\bpair[s]?\b", r"\bpartner\b",
        r"\brelay\b", r"\bduo\b", r"\btwo.?person\b",
    ],
    "Sled Weights/Loading": [
        r"\bsled\b.*\b(weight|kg|lb|load|push|pull|heavy|light)\b",
        r"\b(weight|kg|lb|load|heavy|light)\b.*\bsled\b",
        r"\bsled\s+push\b", r"\bsled\s+pull\b",
        r"\bprowler\b",
    ],
    "Station-Run Transitions": [
        r"\btransition[s]?\b", r"\bstation.?order\b", r"\brun.?between\b",
        r"\broxzone\b", r"\bbetween.?station[s]?\b", r"\bstation.?to.?run\b",
        r"\brun.?to.?station\b", r"\border.?of.?station\b", r"\brace.?flow\b",
    ],
    "Race Format/Structure": [
        r"\brace\s+format\b", r"\brace\s+structure\b", r"\b8\s*x\s*1\s*km\b",
        r"\bhyrox\s+race\b", r"\brace\s+day\b", r"\brace\s+breakdown\b",
        r"\bstation\s+order\b", r"\bfinish\s+time\b", r"\bopen\s+division\b",
        r"\bpro\s+division\b", r"\belite\b.*\bdivision\b", r"\bqualify\b",
        r"\bworld\s+champion\b", r"\brace\s+result\b", r"\bseeding\b",
    ],
    "Station Technique": [
        r"\bskierg\b", r"\brow(er|ing)?\b", r"\bburpee\b.*\bjump\b",
        r"\bwall\s+ball\b", r"\bfarm.?er.?carry\b", r"\blunges?\b",
        r"\bsandbag\b", r"\btechnique\b", r"\bform\b", r"\bpacing\b.*\bstation\b",
        r"\bstation\b.*\bpacing\b", r"\bstation\b.*\bstrateg\b",
        r"\bsled\b", r"\bpush\b.*\bsled\b", r"\bpull\b.*\bsled\b",
    ],
    "Training Programming": [
        r"\bprogram\b", r"\bperiodiz\b", r"\bblock\b", r"\bcycle\b",
        r"\bweek\b.*\bplan\b", r"\btraining\s+plan\b", r"\bworkout\b",
        r"\bsession\b", r"\binterval\b", r"\btempo\b", r"\blong\s+run\b",
        r"\bEMOM\b", r"\bAMRAP\b", r"\bHIIT\b", r"\bstrength\s+train\b",
        r"\bprogressive\s+overload\b", r"\bvolume\b", r"\bintensity\b",
        r"\bRPE\b", r"\bacute\b.*\bchronic\b", r"\bACWR\b",
        r"\bmissed\s+session\b", r"\bdeload\b", r"\btaper\b",
        r"\bbase\s+phase\b", r"\bspecific\s+prep\b", r"\bpeak\b",
    ],
    "Running/Aerobic": [
        r"\brunning\b", r"\bVO2\s*max\b", r"\baerobic\b", r"\bzone\s+[1-5]\b",
        r"\bthreshold\b", r"\blactate\b", r"\bcardiac\s+drift\b",
        r"\bsplit[s]?\b", r"\bpace\b", r"\bmile\b", r"\bkm\b",
        r"\bMAF\b", r"\bheart\s+rate\b.*\btrain\b", r"\bendurance\b",
    ],
    "Nutrition": [
        r"\bnutrition\b", r"\bfuel\b", r"\bcarb\b", r"\bprotein\b",
        r"\bcalori\b", r"\bdiet\b", r"\beat\b", r"\bfood\b",
        r"\bsupplement\b", r"\bcaffein\b", r"\bcreatine\b",
        r"\bhydrat\b", r"\belectrolyte\b", r"\bsodium\b",
        r"\brace\s+day\s+nutrition\b", r"\bpre.?race\b.*\beat\b",
    ],
    "Recovery": [
        r"\brecovery\b", r"\bsleep\b", r"\bHRV\b", r"\brest\s+day\b",
        r"\bovertraining\b", r"\bfatigue\b", r"\binjury\b",
        r"\bmobility\b", r"\bfoam\s+roll\b", r"\bstretching\b",
        r"\bdeload\b", r"\bsoreness\b", r"\bburn.?out\b",
    ],
    "Race Strategy": [
        r"\brace\s+strateg\b", r"\bpacing\s+strateg\b", r"\bnegative\s+split\b",
        r"\bpositive\s+split\b", r"\beven\s+split\b", r"\brace\s+plan\b",
        r"\bwarm.?up\b.*\brace\b", r"\brace\b.*\bwarm.?up\b",
        r"\brace\s+morning\b", r"\bpre.?race\b", r"\brace\s+execution\b",
        r"\brace\s+prep\b",
    ],
    "Mental Game": [
        r"\bmental\b", r"\bpsycholog\b", r"\bmindset\b", r"\bnerv\b",
        r"\banxiet\b", r"\bconfidence\b", r"\bvisuali[sz]\b",
        r"\bself.?talk\b", r"\bmotivat\b", r"\bmental\s+tough\b",
        r"\bfocus\b", r"\bpressure\b",
    ],
    "Sports Science": [
        r"\bresearch\b", r"\bstudy\b", r"\bscience\b", r"\bphysiology\b",
        r"\benergy\s+system\b", r"\boxidative\b", r"\bglycolytic\b",
        r"\baerobic\s+capacity\b", r"\banaerobic\b",
        r"\bmuscle\s+fiber\b", r"\bmitochondri\b",
    ],
    "CrossFit/PRVN": [
        r"\bcrossfit\b", r"\bPRVN\b", r"\bWOD\b", r"\baffiliate\b",
        r"\bfunctional\s+fitness\b",
    ],
    "Athlete Profiles/Elites": [
        r"\bHunter\s+McIntyre\b", r"\bMcIntyre\b", r"\bDearden\b",
        r"\bJake\b.*\bDearden\b", r"\belite\s+athlete\b",
        r"\bworld\s+record\b", r"\bpro\s+athlete\b",
    ],
}

# Additional specific searches (not categories, just counts)
SPECIFIC_SEARCHES = {
    "mentions_equipment_shoes": [
        r"\bshoe[s]?\b", r"\bfootwear\b", r"\binsole\b", r"\bequipment\b",
        r"\bgear\b", r"\bglove[s]?\b", r"\bbelt\b", r"\bwrist.?wrap",
        r"\bknee.?sleeve", r"\bgrip[s]?\b", r"\brace.?vest\b",
        r"\bheart.?rate.?monitor\b", r"\bwatch\b", r"\bgarmin\b", r"\bwhoop\b",
    ],
    "mentions_doubles_team": [
        r"\bdouble[s]?\b", r"\bteam\b", r"\bpair[s]?\b", r"\bpartner\b",
        r"\brelay\b", r"\bduo\b",
    ],
    "mentions_sled_weights": [
        r"\bsled\b.*\b(weight|kg|lb|pound|kilo)\b",
        r"\b(weight|kg|lb|pound|kilo)\b.*\bsled\b",
        r"\bsled\b.*\b\d+\b",
        r"\bprowler\b.*\b(weight|kg|lb)\b",
        r"\b(152|102|103|75|52)\s*(kg|lb)\b",  # common sled weights
    ],
    "mentions_transitions_ordering": [
        r"\btransition[s]?\b", r"\broxzone\b", r"\bstation.?to.?run\b",
        r"\brun.?to.?station\b", r"\bstation\s+order\b", r"\brace\s+flow\b",
        r"\bbetween\s+station[s]?\b",
    ],
}


def get_all_text(messages):
    """Extract all text from a conversation's messages."""
    parts = []
    for msg in messages:
        parts.append(msg.get("content", ""))
    return " ".join(parts)


def get_user_text(messages):
    """Extract only user message text."""
    parts = []
    for msg in messages:
        if msg["role"] == "user":
            parts.append(msg.get("content", ""))
    return " ".join(parts)


def get_assistant_text(messages):
    """Extract only assistant message text."""
    parts = []
    for msg in messages:
        if msg["role"] == "assistant":
            parts.append(msg.get("content", ""))
    return " ".join(parts)


def count_words(text):
    return len(text.split())


def categorize(messages):
    """Return primary category for this example."""
    all_text = get_all_text(messages).lower()
    user_text = get_user_text(messages).lower()

    # Weight user text more heavily (check user text first, then all text)
    for cat_name, patterns in CATEGORIES.items():
        for pattern in patterns:
            if re.search(pattern, user_text, re.IGNORECASE):
                return cat_name

    for cat_name, patterns in CATEGORIES.items():
        for pattern in patterns:
            if re.search(pattern, all_text, re.IGNORECASE):
                return cat_name

    return "Other/Uncategorized"


def matches_any(text, patterns):
    """Check if text matches any of the given patterns."""
    for pattern in patterns:
        if re.search(pattern, text, re.IGNORECASE):
            return True
    return False


def main():
    examples = []
    with open(JSONL_PATH, "r") as f:
        for line_num, line in enumerate(f, 1):
            line = line.strip()
            if not line:
                continue
            try:
                obj = json.loads(line)
                examples.append(obj)
            except json.JSONDecodeError as e:
                print(f"WARNING: Failed to parse line {line_num}: {e}")

    total = len(examples)
    print(f"=" * 80)
    print(f"TRAINING DATA ANALYSIS")
    print(f"=" * 80)
    print(f"\n## 1. Total Examples: {total}\n")

    # Categorize all examples
    categories = defaultdict(list)
    for i, ex in enumerate(examples):
        msgs = ex["messages"]
        cat = categorize(msgs)
        categories[cat].append(i)

    # Calculate stats per category
    print(f"## 2. Distribution by Category\n")
    print(f"{'Category':<30} {'Count':>6} {'%':>7} {'Avg Response Words':>20}")
    print(f"{'-'*30} {'-'*6} {'-'*7} {'-'*20}")

    cat_stats = []
    for cat_name in CATEGORIES.keys():
        indices = categories.get(cat_name, [])
        count = len(indices)
        pct = (count / total * 100) if total > 0 else 0

        # Average response length
        word_counts = []
        for idx in indices:
            assistant_text = get_assistant_text(examples[idx]["messages"])
            word_counts.append(count_words(assistant_text))
        avg_words = sum(word_counts) / len(word_counts) if word_counts else 0

        cat_stats.append((cat_name, count, pct, avg_words))
        print(f"{cat_name:<30} {count:>6} {pct:>6.1f}% {avg_words:>19.0f}")

    # Other
    other_indices = categories.get("Other/Uncategorized", [])
    other_count = len(other_indices)
    other_pct = (other_count / total * 100) if total > 0 else 0
    other_words = []
    for idx in other_indices:
        other_words.append(count_words(get_assistant_text(examples[idx]["messages"])))
    other_avg = sum(other_words) / len(other_words) if other_words else 0
    print(f"{'Other/Uncategorized':<30} {other_count:>6} {other_pct:>6.1f}% {other_avg:>19.0f}")

    print(f"{'-'*30} {'-'*6} {'-'*7} {'-'*20}")
    print(f"{'TOTAL':<30} {total:>6} {'100.0%':>7}")

    # Turn structure analysis
    print(f"\n## 3. Conversation Structure\n")
    single_turn = 0
    multi_turn = 0
    rag_augmented = 0

    turn_counts = []
    for ex in examples:
        msgs = ex["messages"]
        user_msgs = [m for m in msgs if m["role"] == "user"]
        turn_counts.append(len(user_msgs))

        if len(user_msgs) == 1:
            single_turn += 1
        else:
            multi_turn += 1

        # Check for RAG augmentation
        system_msg = msgs[0].get("content", "") if msgs and msgs[0]["role"] == "system" else ""
        if "Relevant knowledge" in system_msg or "relevant knowledge" in system_msg.lower():
            rag_augmented += 1

    print(f"{'Type':<30} {'Count':>6} {'%':>7}")
    print(f"{'-'*30} {'-'*6} {'-'*7}")
    print(f"{'Single-turn (1 Q&A)':<30} {single_turn:>6} {single_turn/total*100:>6.1f}%")
    print(f"{'Multi-turn (2+ Q&A)':<30} {multi_turn:>6} {multi_turn/total*100:>6.1f}%")
    print(f"{'RAG-augmented (system ctx)':<30} {rag_augmented:>6} {rag_augmented/total*100:>6.1f}%")

    if turn_counts:
        print(f"\nTurn distribution: min={min(turn_counts)}, max={max(turn_counts)}, avg={sum(turn_counts)/len(turn_counts):.1f}")

    # Specific searches
    print(f"\n## 4. Specific Topic Counts (searched across ALL text in each example)\n")
    print(f"{'Search':<40} {'Examples Matching':>18} {'%':>7}")
    print(f"{'-'*40} {'-'*18} {'-'*7}")

    for search_name, patterns in SPECIFIC_SEARCHES.items():
        match_count = 0
        matching_indices = []
        for i, ex in enumerate(examples):
            all_text = get_all_text(ex["messages"])
            if matches_any(all_text, patterns):
                match_count += 1
                matching_indices.append(i)

        label = search_name.replace("mentions_", "Mentions ").replace("_", " ")
        print(f"{label:<40} {match_count:>18} {match_count/total*100:>6.1f}%")

    # Deep dive: list actual examples mentioning equipment/shoes
    print(f"\n## 5. Equipment/Shoes — Matching Examples Detail\n")
    equip_patterns = SPECIFIC_SEARCHES["mentions_equipment_shoes"]
    for i, ex in enumerate(examples):
        all_text = get_all_text(ex["messages"])
        if matches_any(all_text, equip_patterns):
            user_text = get_user_text(ex["messages"])
            preview = user_text[:150].replace("\n", " ")
            print(f"  Example {i+1}: {preview}...")

    # Deep dive: list actual examples mentioning Doubles/team
    print(f"\n## 6. Doubles/Team — Matching Examples Detail\n")
    doubles_patterns = SPECIFIC_SEARCHES["mentions_doubles_team"]
    for i, ex in enumerate(examples):
        all_text = get_all_text(ex["messages"])
        if matches_any(all_text, doubles_patterns):
            user_text = get_user_text(ex["messages"])
            preview = user_text[:150].replace("\n", " ")
            # Also show which patterns matched
            matched_pats = []
            for p in doubles_patterns:
                finds = re.findall(p, all_text, re.IGNORECASE)
                if finds:
                    matched_pats.extend(finds)
            print(f"  Example {i+1}: {preview}...")
            print(f"    Matched terms: {matched_pats[:10]}")

    # Deep dive: sled weights
    print(f"\n## 7. Sled Weights — Matching Examples Detail\n")
    sled_patterns = SPECIFIC_SEARCHES["mentions_sled_weights"]
    for i, ex in enumerate(examples):
        all_text = get_all_text(ex["messages"])
        if matches_any(all_text, sled_patterns):
            user_text = get_user_text(ex["messages"])
            preview = user_text[:150].replace("\n", " ")
            print(f"  Example {i+1}: {preview}...")

    # Deep dive: transitions
    print(f"\n## 8. Transitions/Ordering — Matching Examples Detail\n")
    trans_patterns = SPECIFIC_SEARCHES["mentions_transitions_ordering"]
    for i, ex in enumerate(examples):
        all_text = get_all_text(ex["messages"])
        if matches_any(all_text, trans_patterns):
            user_text = get_user_text(ex["messages"])
            preview = user_text[:150].replace("\n", " ")
            print(f"  Example {i+1}: {preview}...")

    # Overall response length stats
    print(f"\n## 9. Overall Response Length Stats\n")
    all_word_counts = []
    for ex in examples:
        wc = count_words(get_assistant_text(ex["messages"]))
        all_word_counts.append(wc)

    all_word_counts.sort()
    print(f"  Min: {min(all_word_counts)} words")
    print(f"  Max: {max(all_word_counts)} words")
    print(f"  Mean: {sum(all_word_counts)/len(all_word_counts):.0f} words")
    print(f"  Median: {all_word_counts[len(all_word_counts)//2]} words")
    print(f"  Total assistant words: {sum(all_word_counts):,}")

    # Summary / Gap Analysis
    print(f"\n{'='*80}")
    print(f"GAP ANALYSIS SUMMARY")
    print(f"{'='*80}")

    equip_count = len(categories.get("Equipment/Shoes", []))
    doubles_count = len(categories.get("Doubles/Team Format", []))
    sled_count = len(categories.get("Sled Weights/Loading", []))
    trans_count = len(categories.get("Station-Run Transitions", []))

    print(f"\n  Equipment/Shoes primary category:    {equip_count:>3} examples ({equip_count/total*100:.1f}%)")
    print(f"  Doubles/Team primary category:       {doubles_count:>3} examples ({doubles_count/total*100:.1f}%)")
    print(f"  Sled Weights primary category:       {sled_count:>3} examples ({sled_count/total*100:.1f}%)")
    print(f"  Transitions primary category:        {trans_count:>3} examples ({trans_count/total*100:.1f}%)")

    # Broader mentions (not just primary category)
    equip_mentions = sum(1 for ex in examples if matches_any(get_all_text(ex["messages"]), SPECIFIC_SEARCHES["mentions_equipment_shoes"]))
    doubles_mentions = sum(1 for ex in examples if matches_any(get_all_text(ex["messages"]), SPECIFIC_SEARCHES["mentions_doubles_team"]))
    sled_mentions = sum(1 for ex in examples if matches_any(get_all_text(ex["messages"]), SPECIFIC_SEARCHES["mentions_sled_weights"]))
    trans_mentions = sum(1 for ex in examples if matches_any(get_all_text(ex["messages"]), SPECIFIC_SEARCHES["mentions_transitions_ordering"]))

    print(f"\n  Equipment/Shoes ANY mention:         {equip_mentions:>3} examples ({equip_mentions/total*100:.1f}%)")
    print(f"  Doubles/Team ANY mention:            {doubles_mentions:>3} examples ({doubles_mentions/total*100:.1f}%)")
    print(f"  Sled Weights ANY mention:            {sled_mentions:>3} examples ({sled_mentions/total*100:.1f}%)")
    print(f"  Transitions ANY mention:             {trans_mentions:>3} examples ({trans_mentions/total*100:.1f}%)")


if __name__ == "__main__":
    main()
