export const topTier = 7; // Master(7) ~ Challenger(9)
const maxLp = 100;
const topTierBase = topTier * 4 * maxLp;

export const getTierStrength = (tier, rank, lp = 0) => {
  let tierLevel, rankLevel;

  // include emerald
  // switch(tier) {
  //     case "IRON": tierLevel = 0; break;
  //     case "BRONZE": tierLevel = 1; break;
  //     case "SILVER": tierLevel = 2; break;
  //     case "GOLD": tierLevel = 3; break;
  //     case "PLATINUM": tierLevel = 4; break;
  //     case "EMERALD": tierLevel = 5; break;
  //     case "DIAMOND": tierLevel = 6; break;
  //     case "MASTER": tierLevel = 7; break;
  //     case "GRANDMASTER": tierLevel = 8; break;
  //     case "CHALLENGER": tierLevel = 9; break;
  //     default: tierLevel = 0; break;
  // }

  // except emerald
  switch (tier) {
    case "IRON":
      tierLevel = 0;
      break;
    case "BRONZE":
      tierLevel = 1;
      break;
    case "SILVER":
      tierLevel = 2;
      break;
    case "GOLD":
      tierLevel = 3;
      break;
    case "PLATINUM":
      tierLevel = 4;
      break;
    case "EMERALD":
      tierLevel = 5;
      break;
    case "DIAMOND":
      tierLevel = 6;
      break;
    case "MASTER":
      tierLevel = 7;
      break;
    case "GRANDMASTER":
      tierLevel = 8;
      break;
    case "CHALLENGER":
      tierLevel = 9;
      break;
    default:
      tierLevel = 0;
      break;
  }

  switch (rank) {
    case "I":
      rankLevel = 3;
      break;
    case "II":
      rankLevel = 2;
      break;
    case "III":
      rankLevel = 1;
      break;
    case "IV":
      rankLevel = 0;
      break;
    default:
      rankLevel = 0;
      break;
  }

  if (tierLevel >= topTier) {
    return topTierBase + lp;
  }

  const strength = (tierLevel * 4 + rankLevel) * maxLp + lp;
  return strength;
};

export const tierKoreanString = (tier) => {
  switch (tier) {
    case "UNRANKED":
      return "언랭";
    case "IRON":
      return "아이언";
    case "BRONZE":
      return "브론즈";
    case "SILVER":
      return "실버";
    case "GOLD":
      return "골드";
    case "PLATINUM":
      return "플래티넘";
    case "EMERALD":
      return "에메랄드";
    case "DIAMOND":
      return "다이아몬드";
    case "MASTER":
      return "마스터";
    case "GRANDMASTER":
      return "그랜드마스터";
    case "CHALLENGER":
      return "챌린저";
    default:
      return tier;
  }
};

export const numberToRank = (number) => {
  switch (number) {
    case 1:
      return "I";
    case 2:
      return "II";
    case 3:
      return "III";
    case 4:
      return "IV";
    default:
      return "";
  }
};

export const rankKoreanString = (rank) => {
  switch (rank) {
    case "I":
      return "1";
    case "II":
      return "2";
    case "III":
      return "3";
    case "IV":
      return "4";
    case "V":
      return "5";
    default:
      return "";
  }
};

export const tierRankKoreanString = (tier, rank, lp) => {
  const lpString = lp != null ? ` (${lp} LP)` : "";
  return `${tierKoreanString(tier)} ${rankKoreanString(rank)}${lpString}`;
};

export const getTierRankByStrength = (strength) => {
  if (strength === 0) return "언랭";
  strength = Math.round(strength);

  let tier, rank, lp;

  if (strength >= topTierBase) {
    const remainLp = strength - topTierBase;
    if (remainLp >= 500) {
      tier = "CHALLENGER";
      rank = "I";
    } else if (remainLp >= 200) {
      tier = "GRANDMASTER";
      rank = "I";
    } else {
      tier = "MASTER";
      rank = "I";
    }
    lp = remainLp;
  } else {
    lp = strength % maxLp;
    strength = Math.floor(strength / maxLp);
    const tierLevel = Math.floor(strength / 4);
    const rankLevel = strength % 4;

    switch (tierLevel) {
      case 0:
        tier = "IRON";
        break;
      case 1:
        tier = "BRONZE";
        break;
      case 2:
        tier = "SILVER";
        break;
      case 3:
        tier = "GOLD";
        break;
      case 4:
        tier = "PLATINUM";
        break;
      case 5:
        tier = "EMERALD";
        break;
      case 6:
        tier = "DIAMOND";
        break;
      case 7:
        tier = "MASTER";
        break;
      case 8:
        tier = "GRANDMASTER";
        break;
      case 9:
        tier = "CHALLENGER";
        break;
      default:
        tier = "%TOO_HIGH%";
        break;
    }

    switch (rankLevel) {
      case 3:
        rank = "I";
        break;
      case 2:
        rank = "II";
        break;
      case 1:
        rank = "III";
        break;
      case 0:
        rank = "IV";
        break;
      default:
        rank = "I";
        break;
    }
  }

  return { tier, rank, lp };
};

export const masteryKoreanPoints = (points) => {
  if (points < 10000) {
    return `${Math.floor(points / 1000)}`;
  } else {
    return `${Math.floor(points / 10000)}만`;
  }
};
