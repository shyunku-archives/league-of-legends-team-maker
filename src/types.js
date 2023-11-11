import { getTierStrength, rankKoreanString, tierKoreanString, topTier } from "./util";

export const ValidTierRanks = {
  UNRANKED: [],
  IRON: ["I", "II", "III", "IV"],
  BRONZE: ["I", "II", "III", "IV"],
  SILVER: ["I", "II", "III", "IV"],
  GOLD: ["I", "II", "III", "IV"],
  PLATINUM: ["I", "II", "III", "IV"],
  EMERALD: ["I", "II", "III", "IV"],
  DIAMOND: ["I", "II", "III", "IV"],
  MASTER: ["I"],
  GRANDMASTER: ["I"],
  CHALLENGER: ["I"],
  flatten: () => {
    return Object.keys(ValidTierRanks).reduce((acc, tier) => {
      const ranks = ValidTierRanks[tier];
      if (typeof ranks === "function") return acc;
      if (ranks.length === 0) return [...acc, `${tier}`];
      const copied = [...ranks];
      return [...acc, ...copied.reverse().map((rank) => `${tier} ${rank}`)];
    }, []);
  },
};

export class RiotUser {
  constructor(name) {
    this.name = name;
    this.id = ""; // encrypted summoner id
    this.accountId = ""; // encrypted account id
    this.puuid = ""; // encrypted puuid
    this.profileIconId = 0;
    this.summonerLevel = 0;
    this.lastUpdateTime = 0;
    /**
     * @type {Tier}
     */
    this.sr_tier = null; // solo rank tier
    /**
     * @type {Tier}
     */
    this.fr_tier = null; // flex rank tier
    /**
     * @type {Tier}
     */
    this.ex_tier = null;
    /**
     * @type {Mastery[]}
     */
    this.masteries = [];
  }

  getRepresentativeTier() {
    if (this.ex_tier) {
      return this.ex_tier.tier;
    } else if (this.sr_tier) {
      return this.sr_tier.tier;
    } else if (this.fr_tier) {
      return this.fr_tier.tier;
    } else {
      // unranked
      return null;
    }
  }

  getRepresentativeStrength() {
    if (this.ex_tier) {
      return this.ex_tier.getStrength();
    } else if (this.sr_tier) {
      return this.sr_tier.getStrength();
    } else if (this.fr_tier) {
      return this.fr_tier.getStrength();
    } else {
      return 0;
    }
  }

  static fromObject(obj) {
    const user = new RiotUser();
    user.name = obj.name;
    user.id = obj.id;
    user.accountId = obj.accountId;
    user.puuid = obj.puuid;
    user.profileIconId = obj.profileIconId;
    user.summonerLevel = obj.summonerLevel;
    user.lastUpdateTime = obj.lastUpdateTime;
    user.sr_tier = obj.sr_tier ? Tier.fromObject(obj.sr_tier) : null;
    user.fr_tier = obj.fr_tier ? Tier.fromObject(obj.fr_tier) : null;
    user.ex_tier = obj.ex_tier ? Tier.fromObject(obj.ex_tier) : null;
    user.masteries = obj.masteries.map((mastery) => Mastery.fromObject(mastery));
    return user;
  }
}

export class Mastery {
  constructor(championId, championLevel, championPoints) {
    this.championId = championId;
    this.championLevel = championLevel;
    this.championPoints = championPoints;
  }

  static fromObject(obj) {
    const mastery = new Mastery();
    mastery.championId = obj.championId;
    mastery.championLevel = obj.championLevel;
    mastery.championPoints = obj.championPoints;
    return mastery;
  }
}

export class Tier {
  constructor(tier, rank, lp = null, wins = 0, losses = 0) {
    this.tier = tier; // tier: silver, gold, ...
    this.rank = rank; // rank: I, II, III, IV
    this.lp = lp;
    this.wins = wins;
    this.losses = losses;

    if (this.lp == null) {
      let tierNum = Tier.getTierNum(this.tier);
      switch (tierNum) {
        case 7:
          this.lp = 0;
          break;
        case 8:
          this.lp = 200;
          break;
        case 9:
          this.lp = 500;
          break;
        default:
          this.lp = 0;
          break;
      }
    }
  }

  getTierRankString() {
    return `${this.tier} ${this.rank}`;
  }

  getTierRankKoreanString() {
    return `${this.getTierKoreanString()} ${this.getRankKoreanString()}` + (this.lp != null ? ` (${this.lp} LP)` : "");
  }

  getTierRankKoreanSmartString() {
    // if tier is under toptier, then hide lp
    const tierNum = Tier.getTierNum(this.tier);
    if (tierNum >= topTier) return this.getTierRankKoreanString();
    return this.getTierRankKoreanStringWithoutLP();
  }

  getTierRankKoreanStringWithoutLP() {
    return `${this.getTierKoreanString()} ${this.getRankKoreanString()}`;
  }

  getTierKoreanString() {
    return tierKoreanString(this.tier);
  }

  getRankKoreanString() {
    return rankKoreanString(this.rank);
  }

  getStrength() {
    return getTierStrength(this.tier, this.rank, this.lp);
  }

  static getTierNum(tier) {
    let tierLevel;
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
    return tierLevel;
  }

  static fromObject(obj) {
    const tier = new Tier();
    tier.tier = obj.tier;
    tier.rank = obj.rank;
    tier.lp = obj.lp;
    tier.wins = obj.wins;
    tier.losses = obj.losses;
    return tier;
  }
}

export function toRelativeTime(milli) {
  const now = Date.now();
  const diff = now - milli;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const years = Math.floor(days / 365);

  if (years > 0) {
    return `${years}년 전`;
  } else if (days > 0) {
    return `${days}일 전`;
  } else if (hours > 0) {
    return `${hours}시간 전`;
  } else if (minutes > 0) {
    return `${minutes}분 전`;
  } else if (seconds > 0) {
    return `${seconds}초 전`;
  } else {
    return "방금 전";
  }
}
