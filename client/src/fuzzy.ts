export class FZF {
  static _scoreMatch = 16;
  static _scoreGapExtention = -1;
  static _scoreGapStart = -3;
  static _bonusBoundary = FZF._scoreMatch / 2;
  static _bonusConsecutive = -(FZF._scoreGapStart + FZF._scoreGapExtention);
  static _bonusFirstCharMultiplier = 2;
  static _bonusCamel123 = FZF._bonusBoundary + FZF._scoreGapExtention;
  static _bonusNonWord = FZF._scoreMatch / 2;


  static _getCharClass(c) {
    if (c >= '0' && c <= '9') {
      return "numeric";
    } else if (c.toUpperCase() == c.toLowerCase()) {
      return "nonword";
    } else if (c == c.toUpperCase()) {
      return "uppercase";
    } else if (c == c.toLowerCase()) {
      return "lowercase";
    } else {
      return "nonword";
    }
  }

  static _calculateBonus(prevClass, currentClass) {
    if (prevClass == "nonword" && currentClass != "nonword") {
      return FZF._bonusBoundary;
    } else if ((prevClass == "lowercase" && currentClass == "charUpper")
      || (prevClass != "numeric" && currentClass == "numeric")) {
      return FZF._bonusCamel123;
    } else if (currentClass == "nonword") {
      return FZF._bonusNonWord;
    }

    return 0;
  }

  static _calculateScore(string, pattern, sidx, eidx) {
    let pidx = 0;
    let score = 0;
    let inGap = false;
    let consecutive = 0;
    let firstBonus = 0;
    let prevClass = "nonword";

    if (sidx < 0 || eidx < 0) {
      return 0;
    }


    if (sidx > 0) {
      prevClass = FZF._getCharClass(string[sidx - 1]);
    }

    let i;
    for (i = sidx; i <= eidx; i++) {
      let s_char = string[i]
      let currentClass = FZF._getCharClass(s_char);
      s_char = s_char.toLowerCase();

      if (s_char == pattern[pidx]) {
        score += FZF._scoreMatch;
        let bonus = FZF._calculateBonus(prevClass, currentClass);

        if (consecutive == 0) {
          firstBonus = bonus;
        } else {
          if (bonus == FZF._bonusBoundary) {
            firstBonus = bonus;
          }
          bonus = Math.max(bonus, firstBonus, FZF._bonusConsecutive)
        }

        if (pidx == 0) {
          score += bonus * FZF._bonusFirstCharMultiplier;
        } else {
          score += bonus;
        }

        inGap = false;
        consecutive ++;
        pidx++;
      } else { // s_char and p_char do not match
        if (inGap) {
          score += FZF._scoreGapExtention;
        } else {
          score += FZF._scoreGapStart;
        }

        inGap = true;
        consecutive = 0;
        firstBonus = 0;
      }
      prevClass = currentClass;
    }

    return score;
  }

  //TODO handle case sensitivity (optional)
  // assumption: pattern is always lowercase
  static fzf_match(pattern, string) {
    let pidx = 0; // pattern index
    let sidx = -1; // start index (index of first char of pattern in string)
    let eidx = -1; // end index (index of last char of pattern in string)
    let score = 0; // score for the match

    // 1st step: go forward, find first match
    let i;
    for (i = 0; i < string.length; i++) {
      let s_char = string[i].toLowerCase();
      let p_char = pattern[pidx];

      if (s_char == p_char) {
        if (sidx < 0) {
          sidx = i;
        }
        pidx++;
        if (pidx == pattern.length) {
          eidx = i;
          break;
        }
      }
    }

    // 2nd step: go backward, look for better match
    if (sidx >= 0 && eidx >= 0) {
      pidx--;
      for (i = eidx; i >= sidx; i--) {
        let s_char = string[i].toLowerCase();
        let p_char = pattern[pidx];

        if (s_char == p_char) {
          pidx--;
          if (pidx < 0) {
            sidx = i;
            break;
          }
        }
      }
    } else {
      return {matched: false, score: 0};
    }


    score = FZF._calculateScore(string, pattern, sidx, eidx);
    return {matched: true, score: score};
  }

  static fzf_sort(pattern, stringlist) {
    let result = [];
    stringlist.forEach((s) => {
      let match = FZF.fzf_match(pattern, s);
      if (match.matched) {
        result.push({string: s, score: match.score});
      }
    }
    );

    return result.sort((a,b) => b.score - a.score);
  }
}
