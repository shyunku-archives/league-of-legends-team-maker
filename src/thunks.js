import axios from "axios";
import { Mastery, RiotUser, Tier } from "./types";
const RIOT_API_KEY = process.env.REACT_APP_RIOT_API_KEY;
const prefix = "https://kr.api.riotgames.com";

const requestRiot = async (path) => {
  const resp = await axios.get(`${prefix}${path}?api_key=${RIOT_API_KEY}`);
  return resp.data;
};

export const getSummonerByName = async (summonerName) => {
  return await requestRiot(`/lol/summoner/v4/summoners/by-name/${summonerName}`);
};

export const getLatestDataDragonURL = async () => {
  const resp = await axios.get("https://ddragon.leagueoflegends.com/api/versions.json");
  const data = resp.data;
  const latestVersion = data[0];
  return `https://ddragon.leagueoflegends.com/cdn/${latestVersion}`;
};

export const getMasteryInfo = async (summonerId) => {
  return await requestRiot(`/lol/champion-mastery/v4/champion-masteries/by-summoner/${summonerId}`);
};

/**
 *
 * @param {string} summonerName
 * @returns {RiotUser}
 */
export const getSummonerAllInfo = async (summonerName) => {
  const summonerInfo = await getSummonerByName(summonerName);
  const { id, accountId, puuid, name } = summonerInfo;
  // get solo tier, 5vs5 tier, top tier
  const leagueInfo = await requestRiot(`/lol/league/v4/entries/by-summoner/${id}`);
  const reducedLeagueInfo = leagueInfo.reduce((acc, cur) => {
    acc[cur?.queueType ?? "unknown"] = cur;
    return acc;
  }, {});

  const masteryInfo = await getMasteryInfo(id);
  const submasteries = masteryInfo.slice(0, 5);
  console.log("summonerInfo", summonerInfo);

  const user = new RiotUser(name);
  user.id = id;
  user.accountId = accountId;
  user.puuid = puuid;
  user.profileIconId = summonerInfo.profileIconId;
  user.summonerLevel = summonerInfo.summonerLevel;
  user.lastUpdateTime = Date.now();
  user.masteries = submasteries.map((mastery) => {
    const { championId, championLevel, championPoints } = mastery;
    return new Mastery(championId, championLevel, championPoints);
  });

  if (reducedLeagueInfo["RANKED_SOLO_5x5"]) {
    const { tier, rank, leaguePoints: lp, wins, losses } = reducedLeagueInfo["RANKED_SOLO_5x5"];
    user.sr_tier = new Tier(tier, rank, lp, wins, losses);
  }
  if (reducedLeagueInfo["RANKED_FLEX_SR"]) {
    const { tier, rank, leaguePoints: lp, wins, losses } = reducedLeagueInfo["RANKED_FLEX_SR"];
    user.fr_tier = new Tier(tier, rank, lp, wins, losses);
  }

  return user;
};

export default {};
