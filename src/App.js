import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getLatestDataDragonURL, getSummonerAllInfo } from "./thunks";
import {
  IoArrowUp,
  IoCalculator,
  IoShuffle,
  IoSwapHorizontal,
  IoArrowDown,
  IoReturnDownBack,
  IoClose,
} from "react-icons/io5";
import { getTierRankByStrength, tierRankKoreanString } from "./util";
import PackageJson from "../package.json";
import axios, { AxiosError } from "axios";
import { RiotUser, Tier, toRelativeTime } from "./types";
import toast from "react-hot-toast";
import PlayerCard from "components/PlayerCard";

function App() {
  const [initialized, setInitialized] = useState(false);
  const [userMap, setUserMap] = useState({});
  const [summonerNameInput, setSummonerNameInput] = useState("");

  const [dragging, setDragging] = useState(false);
  const [droppingTeam1, setDroppingTeam1] = useState(false);
  const [droppingTeam2, setDroppingTeam2] = useState(false);
  const [team1players, setTeam1Players] = useState({});
  const [team2players, setTeam2Players] = useState({});
  const [playerQueue, setPlayerQueue] = useState({});

  const [ddragonURL, setDdragonURL] = useState("");
  const [championMap, setChampionMap] = useState({});

  const team1Strength = useMemo(() => {
    let sum = 0;
    for (let e in team1players) {
      const user = userMap[e];
      if (user == null) continue;
      sum += user.getRepresentativeStrength();
    }
    return sum;
  }, [team1players, userMap]);

  const team2Strength = useMemo(() => {
    let sum = 0;
    for (let e in team2players) {
      const user = userMap[e];
      if (user == null) continue;
      sum += user.getRepresentativeStrength();
    }
    return sum;
  }, [team2players, userMap]);

  const team1AvgStrength = useMemo(() => {
    let sum = 0;
    let count = 0;
    for (let e in team1players) {
      const user = userMap[e];
      if (user == null) continue;
      // if (user.getRepresentativeStrength() === 0) continue;
      sum += user.getRepresentativeStrength();
      count++;
    }
    if (count === 0) return 0;
    return sum / count;
  }, [team1players, userMap]);

  const team2AvgStrength = useMemo(() => {
    let sum = 0;
    let count = 0;
    for (let e in team2players) {
      const user = userMap[e];
      if (user == null) continue;
      // if (user.getRepresentativeStrength() === 0) continue;
      sum += user.getRepresentativeStrength();
      count++;
    }
    if (count === 0) return 0;
    return sum / count;
  }, [team2players, userMap]);

  const team1TierRank = useMemo(() => {
    return getTierRankByStrength(team1AvgStrength);
  }, [team1AvgStrength]);

  const team2TierRank = useMemo(() => {
    return getTierRankByStrength(team2AvgStrength);
  }, [team2AvgStrength]);

  const isReady = useMemo(() => {
    return ddragonURL !== "";
  }, [ddragonURL]);

  useEffect(() => {
    if (!initialized) {
      let isInitial =
        Object.keys(userMap).length === 0 &&
        Object.keys(team1players).length === 0 &&
        Object.keys(team2players).length === 0 &&
        Object.keys(playerQueue).length === 0;
      if (isInitial) {
        const userMapStr = localStorage.getItem("userMap");
        const team1playersStr = localStorage.getItem("team1players");
        const team2playersStr = localStorage.getItem("team2players");
        const playerQueueStr = localStorage.getItem("playerQueue");

        if (userMapStr != null) {
          try {
            const userMapObj = JSON.parse(userMapStr);
            const refinedUserMapObj = Object.keys(userMapObj).reduce((acc, cur) => {
              const user = userMapObj[cur];
              if (user == null) return acc;
              acc[user.puuid] = RiotUser.fromObject(user);
              return acc;
            }, {});
            console.log(refinedUserMapObj);
            setUserMap(refinedUserMapObj);

            if (team1playersStr != null) {
              const team1playersObj = JSON.parse(team1playersStr);
              for (let team1MemberId in team1playersObj) {
                if (!refinedUserMapObj.hasOwnProperty(team1MemberId)) {
                  delete team1playersObj[team1MemberId];
                }
              }
              console.log(team1playersObj);
              setTeam1Players(team1playersObj);
            }
            if (team2playersStr != null) {
              const team2playersObj = JSON.parse(team2playersStr);
              for (let team2MemberId in team2playersObj) {
                if (!refinedUserMapObj.hasOwnProperty(team2MemberId)) {
                  delete team2playersObj[team2MemberId];
                }
              }
              console.log(team2playersObj);
              setTeam2Players(team2playersObj);
            }
            if (playerQueueStr != null) {
              const playerQueueObj = JSON.parse(playerQueueStr);
              for (let queueMemberId in playerQueueObj) {
                if (!refinedUserMapObj.hasOwnProperty(queueMemberId)) {
                  delete playerQueueObj[queueMemberId];
                }
              }
              console.log(playerQueueObj);
              setPlayerQueue(playerQueueObj);
            }
          } catch (err) {
            console.error(err);
          }
        }

        setInitialized(true);
      }
    }
    localStorage.setItem("userMap", JSON.stringify(userMap));
    localStorage.setItem("team1players", JSON.stringify(team1players));
    localStorage.setItem("team2players", JSON.stringify(team2players));
    localStorage.setItem("playerQueue", JSON.stringify(playerQueue));
  }, [userMap, team1players, team2players, initialized, playerQueue]);

  useEffect(() => {
    (async () => {
      const url = await getLatestDataDragonURL();
      setDdragonURL(url);

      try {
        const championsResp = await axios.get(`${url}/data/ko_KR/champion.json`);
        const champions = championsResp.data.data;
        const map = Object.keys(champions).reduce((acc, cur) => {
          const champion = champions[cur];
          acc[champion.key] = champion;
          return acc;
        }, {});
        setChampionMap(map);
      } catch (err) {
        console.error(err);
      }
    })();
  }, []);

  const onSearch = async (e = null, user = null) => {
    if (e != null) {
      e.preventDefault();
      e.stopPropagation();
    }
    const input = user === null ? summonerNameInput : user?.name;
    setSummonerNameInput("");

    const isUpdate = user !== null;
    if (input === "") return;
    let alreadyExists = Object.keys(userMap).reduce((acc, cur) => {
      if (acc) return acc;
      if (userMap[cur].name.toLowerCase() === input.toLowerCase()) {
        return true;
      }
      return acc;
    }, false);
    if (!isUpdate && alreadyExists) {
      toast.error(`"${input}"는/은 이미 추가된 소환사입니다.`);
      return;
    }

    try {
      const res = await getSummonerAllInfo(input);
      setUserMap((prev) => ({ ...prev, [res.puuid]: res }));
      if (!alreadyExists) {
        setPlayerQueue((prev) => ({ ...prev, [res.puuid]: true }));
      }
      toast.success("추가 완료!");
    } catch (err) {
      if (err instanceof AxiosError) {
        console.log(err);
        console.log(err.response);
        console.log(JSON.stringify(err));
        toast.error("소환사 정보를 가져오는데 실패했습니다.");
      } else {
        toast.error("오류가 발생했습니다!");
      }
    }
  };

  const onRemovePlayer = (e, userId) => {
    e.preventDefault();
    e.stopPropagation();
    setUserMap((prev) => {
      const newMap = { ...prev };
      delete newMap[userId];
      return newMap;
    });
    setTeam1Players((prev) => {
      const newMap = { ...prev };
      delete newMap[userId];
      return newMap;
    });
    setTeam2Players((prev) => {
      const newMap = { ...prev };
      delete newMap[userId];
      return newMap;
    });
    setPlayerQueue((prev) => {
      const newMap = { ...prev };
      delete newMap[userId];
      return newMap;
    });
  };

  const onMovePlayer = (e, userId, team) => {
    e.preventDefault();
    e.stopPropagation();
    if (team === 1) {
      setTeam1Players((prev) => {
        const newMap = { ...prev };
        delete newMap[userId];
        return newMap;
      });
      if (userMap.hasOwnProperty(userId)) {
        setTeam2Players((prev) => ({ ...prev, [userId]: true }));
      }
    } else {
      setTeam2Players((prev) => {
        const newMap = { ...prev };
        delete newMap[userId];
        return newMap;
      });
      if (userMap.hasOwnProperty(userId)) {
        setTeam1Players((prev) => ({ ...prev, [userId]: true }));
      }
    }
  };

  const onPlayerDragStart = (e, userId) => {
    // e.preventDefault();
    // e.stopPropagation();
    setDragging(true);
    e.dataTransfer.setData("text/plain", userId);

    console.log("-> drag start", e.target);
  };

  const onPlayerDragEnd = (e) => {
    setDragging(false);
    // e.target.classList.remove("grabbing");
    console.log("<- drag end", e.target);
  };

  const onMovePlayerToQueue = (e, userId) => {
    e.preventDefault();
    setPlayerQueue((prev) => ({ ...prev, [userId]: true }));
    setTeam1Players((prev) => {
      const newMap = { ...prev };
      delete newMap[userId];
      return newMap;
    });
    setTeam2Players((prev) => {
      const newMap = { ...prev };
      delete newMap[userId];
      return newMap;
    });
  };

  // team1
  const onTeam1DragEnter = (e) => {
    e.preventDefault();
    setDroppingTeam1(true);
  };

  const onTeam1DragLeave = (e) => {
    e.preventDefault();
    setDroppingTeam1(false);
  };

  const onTeam1DragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    // console.log("team1 drag over", e.target);
  };

  const onTeam1Drop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);
    setDroppingTeam1(false);

    const draggingUserId = e.dataTransfer.getData("text/plain");
    console.log("team1 add", draggingUserId);
    setTeam1Players((prev) => ({ ...prev, [draggingUserId]: true }));
    setPlayerQueue((prev) => {
      const newMap = { ...prev };
      delete newMap[draggingUserId];
      return newMap;
    });
  };

  //team2
  const onTeam2DragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDroppingTeam2(true);
  };

  const onTeam2DragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDroppingTeam2(false);
  };

  const onTeam2DragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    // console.log("team2 drag over", e.target);
  };

  const onTeam2Drop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);
    setDroppingTeam2(false);

    const draggingUserId = e.dataTransfer.getData("text/plain");
    console.log("team2 add", draggingUserId);
    setTeam2Players((prev) => ({ ...prev, [draggingUserId]: true }));
    setPlayerQueue((prev) => {
      const newMap = { ...prev };
      delete newMap[draggingUserId];
      return newMap;
    });
  };

  const swapTeams = () => {
    const newTeam1 = { ...team2players };
    const newTeam2 = { ...team1players };
    setTeam1Players(newTeam1);
    setTeam2Players(newTeam2);
  };

  const combineAllPlayers = () => {
    const team1 = { ...team1players };
    const team2 = { ...team2players };
    const queue = { ...playerQueue };

    const combined = Object.keys(team1).concat(Object.keys(team2)).concat(Object.keys(queue));
    combined.sort(() => Math.random() - 0.5);

    const newTeam1 = {};
    const newTeam2 = {};

    for (let i = 0; i < combined.length; i++) {
      if (i % 2 === 0) {
        newTeam1[combined[i]] = true;
      } else {
        newTeam2[combined[i]] = true;
      }
    }

    setTeam1Players(newTeam1);
    setTeam2Players(newTeam2);
    setPlayerQueue({});
  };

  const shufflePlayers = () => {
    const newTeam1 = { ...team1players };
    const newTeam2 = { ...team2players };

    const shuffledPlayers = Object.keys(newTeam1).concat(Object.keys(newTeam2));
    shuffledPlayers.sort(() => Math.random() - 0.5);

    const newTeam1Players = shuffledPlayers.slice(0, Object.keys(newTeam1).length);
    const newTeam2Players = shuffledPlayers.slice(Object.keys(newTeam1).length);

    const newTeam1Map = newTeam1Players.reduce((acc, cur) => {
      acc[cur] = true;
      return acc;
    }, {});
    const newTeam2Map = newTeam2Players.reduce((acc, cur) => {
      acc[cur] = true;
      return acc;
    }, {});

    setTeam1Players(newTeam1Map);
    setTeam2Players(newTeam2Map);
  };

  const combinateTeamByStrengthWithBalance = () => {
    const allPlayers = { ...team1players, ...team2players };
    const playerStrengths = Object.keys(allPlayers).reduce((acc, playerId) => {
      acc[playerId] = userMap[playerId].getRepresentativeStrength();
      return acc;
    }, {});

    const totalStrength = Object.values(playerStrengths).reduce((sum, strength) => sum + strength, 0);
    const pickerLength = Math.floor(Object.keys(playerStrengths).length / 2);

    // console.log("playerStrengths", playerStrengths);

    // index 0 ~ 9, combine 5 players
    const iterate = (arr, num) => {
      const results = [];
      if (num === 1) {
        return arr.map((element) => [element]);
      }
      arr.forEach((fixed, index, origin) => {
        const rest = origin.slice(index + 1);
        const combinations = iterate(rest, num - 1);
        const attached = combinations.map((combination) => [fixed, ...combination]);
        results.push(...attached);
      });
      return results;
    };

    const combinations = iterate(Object.keys(playerStrengths), pickerLength);

    let bestCombinations = [];
    let bestDiff = Infinity;
    combinations.forEach((combination) => {
      const team1Strength = combination.reduce((sum, id) => sum + playerStrengths[id], 0);

      const team2Strength = totalStrength - team1Strength;
      const diff = Math.abs(team1Strength - team2Strength);
      if (diff < bestDiff) {
        bestDiff = diff;
        bestCombinations = [combination];
      } else if (Math.abs(diff - bestDiff) < 100) {
        bestCombinations.push(combination);
      }
    });

    const newTeam1 = {};
    const newTeam2 = {};

    const randomIndex = Math.floor(Math.random() * bestCombinations.length);
    const bestCombination = bestCombinations[randomIndex];
    // console.log("combinations", combinations);
    console.log("bestCombinations", bestCombinations);
    console.log("bestCombination", bestCombination);
    for (let playerId in playerStrengths) {
      if (bestCombination.includes(playerId)) {
        newTeam1[playerId] = true;
      } else {
        newTeam2[playerId] = true;
      }
    }

    setTeam1Players(newTeam1);
    setTeam2Players(newTeam2);
  };

  const initAllExTier = () => {
    const newMap = { ...userMap };
    Object.keys(newMap).forEach((e) => {
      newMap[e].ex_tier = null;
    });
    setUserMap(newMap);
  };

  const moveAllToQueue = () => {
    const newQueue = { ...playerQueue };
    const team1 = { ...team1players };
    const team2 = { ...team2players };

    Object.keys(team1).forEach((e) => {
      newQueue[e] = true;
    });
    Object.keys(team2).forEach((e) => {
      newQueue[e] = true;
    });

    setPlayerQueue(newQueue);
    setTeam1Players({});
    setTeam2Players({});
  };

  const removeAll = () => {
    const answer = window.confirm("정말로 모든 소환사를 제거하시겠습니까?");
    if (!answer) return;
    setUserMap({});
    setPlayerQueue({});
    setTeam1Players({});
    setTeam2Players({});
  };

  const playerProps = {
    ddragonURL: ddragonURL,
    championMap,
    userMap,
    setUserMap,
    onRemovePlayer: onRemovePlayer,
    onMovePlayer: onMovePlayer,
    onUpdatePlayer: onSearch,
    onPlayerDragStart: onPlayerDragStart,
    onPlayerDragEnd: onPlayerDragEnd,
    onMovePlayerToQueue: onMovePlayerToQueue,
  };

  // TODO :: delete later (after line select)
  const playerSorter = useCallback(
    (a, b) => {
      const userA = userMap[a];
      const userB = userMap[b];
      if (userA == null || userB == null) return 0;
      const strengthA = userA.getRepresentativeStrength();
      const strengthB = userB.getRepresentativeStrength();
      return strengthB - strengthA;
    },
    [userMap]
  );

  // console.log(userMap);

  return (
    <div className="App">
      <div className="main-content">
        <header></header>
        <div className="title">LOL 사용자 설정 게임 팀 구성 {PackageJson.version}v</div>
        {/* <div className="description">
          본 서비스는 리그오브레전드의 사용자 설정 게임에서 팀 인원 분배를 도와주는 툴 및 기능을 제공합니다.
          <br />
          사용자 설정 게임은 2명 이상의 플레이어들이 팀을 구성하여 게임을 진행하는 방식으로,
          <br />
          플레이어들은 팀을 구성할 때 플레이어들의 레벨, 티어, 실력 등을 고려하여 팀을 구성합니다.
          <br />
          이러한 과정은 여러가지 방법을 통해 진행되나 이는 번거롭고 시간이 많이 소요되는 작업입니다.
          <br />본 서비스는 이러한 번거로움을 줄이고자 여러 기능을 제공합니다.{" "}
          <span style={{ color: "#5080F050", fontWeight: "bold" }}>by shyunku</span>
        </div> */}
        <div className="description additional">
          하단의 소환사 검색창에 소환사명 입력 후 엔터를 누르면 대기열에 추가됩니다.
          <br />
          대기열에 추가된 소환사나 팀에 배치된 소환사는 드래그 앤 드롭을 통해 팀 또는 대기열에 재배치할 수 있습니다.
        </div>
        <div className="player-searcher" style={{ visibility: isReady ? "visible" : "hidden" }}>
          <input
            placeholder="소환사 검색으로 대기열에 추가"
            spellCheck={false}
            value={summonerNameInput}
            onChange={(e) => setSummonerNameInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                onSearch();
              }
            }}
          />
        </div>
        <div className="functions">
          <div className="function best" onClick={combinateTeamByStrengthWithBalance}>
            <div className="icon">
              <IoCalculator />
            </div>
            <div className="name">최적의 조합</div>
          </div>
          <div className="function" onClick={combineAllPlayers}>
            <div className="icon">
              <IoArrowUp />
            </div>
            <div className="name">모두 올리기</div>
          </div>
          <div className="function" onClick={moveAllToQueue}>
            <div className="icon">
              <IoArrowDown />
            </div>
            <div className="name">전부 대기열로 이동</div>
          </div>
          <div className="function" onClick={swapTeams}>
            <div className="icon">
              <IoSwapHorizontal />
            </div>
            <div className="name">팀 스왑하기</div>
          </div>
          <div className="function" onClick={shufflePlayers}>
            <div className="icon">
              <IoShuffle />
            </div>
            <div className="name">소환사 섞기</div>
          </div>
          <div className="function" onClick={initAllExTier}>
            <div className="icon">
              <IoReturnDownBack />
            </div>
            <div className="name">지정 랭크 초기화</div>
          </div>
          <div className="function negative" onClick={removeAll}>
            <div className="icon">
              <IoClose />
            </div>
            <div className="name">전부 제거</div>
          </div>
        </div>
        <div className="segment" />
        <div className="composition-info">
          <div className="distribution">
            {Object.keys(team1players).length}명 vs {Object.keys(team2players).length}명
          </div>
          <div className="avg-diff">± {Math.abs(team1Strength - team2Strength).toFixed(0)} LP</div>
        </div>
        <div className="team-composition">
          <div
            className={"team team-1 " + (droppingTeam1 ? "dropping" : "") + (dragging ? " dragging" : "")}
            onDragEnter={onTeam1DragEnter}
            onDragLeave={onTeam1DragLeave}
            onDragOver={onTeam1DragOver}
            onDrop={onTeam1Drop}
          >
            <div className="header">
              <div className="team-title">팀 1</div>
              {team1TierRank?.tier != null && (
                <div className={"team-strength tier " + team1TierRank?.tier?.toLowerCase?.()}>
                  평균 {tierRankKoreanString(team1TierRank?.tier, team1TierRank?.rank, team1TierRank?.lp)}
                </div>
              )}
              <div className="team-avg-strength">{team1Strength.toFixed(0)} LP</div>
            </div>
            <div className="team-members">
              <div className="filter">팀 1에 추가</div>
              {Object.keys(team1players)
                .filter((e) => userMap[e] != null)
                // .sort(playerSorter)
                .map((e, ind) => (
                  <PlayerCard key={ind} user={userMap[e] ?? null} team={1} {...playerProps} />
                ))}
            </div>
          </div>
          <div
            className={"team team-2 " + (droppingTeam2 ? "dropping" : "") + (dragging ? " dragging" : "")}
            onDragEnter={onTeam2DragEnter}
            onDragLeave={onTeam2DragLeave}
            onDragOver={onTeam2DragOver}
            onDrop={onTeam2Drop}
          >
            <div className="header">
              <div className="team-title">팀 2</div>
              {team2TierRank?.tier != null && (
                <div className={"team-strength tier " + team2TierRank?.tier?.toLowerCase?.()}>
                  평균 {tierRankKoreanString(team2TierRank?.tier, team2TierRank?.rank, team2TierRank?.lp)}
                </div>
              )}
              <div className="team-avg-strength">{team2Strength.toFixed(0)} LP</div>
            </div>
            <div className="team-members">
              <div className="filter">팀 2에 추가</div>
              {Object.keys(team2players)
                .filter((e) => userMap[e] != null)
                // .sort(playerSorter)
                .map((e, ind) => (
                  <PlayerCard key={ind} user={userMap[e] ?? null} team={2} {...playerProps} />
                ))}
            </div>
          </div>
        </div>
        <div className="segment" />
        <div className="player-queue">
          <div className="player-queue-title">대기열</div>
          <div className="player-queue-members">
            {Object.keys(playerQueue)
              .filter((e) => userMap[e] != null)
              .sort(playerSorter)
              .map((e, ind) => (
                <PlayerCard key={ind} user={userMap[e] ?? null} {...playerProps} />
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
