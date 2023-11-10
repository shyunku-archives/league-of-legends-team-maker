import { getTierStrength, rankKoreanString, tierKoreanString } from "./util";

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
    if (this.sr_tier) {
      return this.sr_tier.tier;
    } else if (this.fr_tier) {
      return this.fr_tier.tier;
    } else {
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
  constructor(tier, rank, lp, wins, losses) {
    this.tier = tier; // tier: silver, gold, ...
    this.rank = rank; // rank: I, II, III, IV
    this.lp = lp;
    this.wins = wins;
    this.losses = losses;
  }

  getTierRankString() {
    return `${this.tier} ${this.rank}`;
  }

  getTierRankKoreanString() {
    return `${this.getTierKoreanString()} ${this.getRankKoreanString()}`;
  }

  getTierKoreanString() {
    return tierKoreanString(this.tier);
  }

  getRankKoreanString() {
    return rankKoreanString(this.rank);
  }

  getStrength() {
    return getTierStrength(this.tier, this.rank);
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
