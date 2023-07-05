export const getTierStrength = (tier, rank) => {
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
    case "DIAMOND":
      tierLevel = 5;
      break;
    case "MASTER":
      tierLevel = 6;
      break;
    case "GRANDMASTER":
      tierLevel = 7;
      break;
    case "CHALLENGER":
      tierLevel = 8;
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

  const strength = tierLevel * 4 + rankLevel;
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

export const tierRankKoreanString = (tier, rank) => {
  return `${tierKoreanString(tier)} ${rankKoreanString(rank)}`;
};

export const getTierRankByStrength = (strength) => {
  if (strength === 0) return "언랭";
  strength = Math.round(strength);
  const tierLevel = Math.floor(strength / 4);
  const rankLevel = strength % 4;

  let tier, rank;

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
      tier = "DIAMOND";
      break;
    case 6:
      tier = "MASTER";
      break;
    case 7:
      tier = "GRANDMASTER";
      break;
    case 8:
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

  return { tier, rank };
};

export const masteryKoreanPoints = (points) => {
  if (points < 10000) {
    return `${Math.floor(points / 1000)}`;
  } else {
    return `${Math.floor(points / 10000)}만`;
  }
};
