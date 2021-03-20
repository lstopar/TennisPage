const structs = require('../structs/player-structs.js');

class TeamStats {
    constructor(teamId) {
        let self = this;

        self._teamId = teamId;
        self._leaguePoints = 0;
        self._winCount = 0;
        self._lossCount = 0;
        self._gamesWon = 0;
        self._gamesLost = 0;
    }

    get leaguePoints() {
        return this._leaguePoints;
    }

    get winCount() {
        return this._winCount;
    }

    get lossCount() {
        return this._lossCount;
    }

    get gamesWon() {
        return this._gamesWon;
    }

    get gamesLost() {
        return this._gamesLost;
    }

    addLeaguePoints(nPoints) {
        this._leaguePoints += nPoints;
    }

    addWin() {
        ++this._winCount;
    }

    addLoss() {
        ++this._lossCount;
    }

    addGamesWon(nGames) {
        this._gamesWon += nGames;
    }

    addGamesLost(nGames) {
        this._gamesLost += nGames;
    }
}

class LeagueSorter {

    rankTeams(matches) {
        /*
        1. Aktualna lestvica za vse igralke, igralce in mešane dvojice ter končna lestvica za uvrstitev v Play off, se določi po naslednjih kriterijih, ki se jih upošteva glede na vse odigrane kroge rednega dela Lige :
            1. število osvojenih točk,
            2. število zmag,
            3. število porazov,
            4. razlika med osvojenimi in izgubljenimi gemi (Odločilni set -Tie-break šteje za 1. točko)
            5. štetje števila osvojenih gemov (Odločilni set -Tie-break šteje za 1. točko).
        */

        // rank the players using the point system
        // afterwards break ties using the rules

        // construct a array of teams
        let teamMap = new Map();
        let teamStatsMap = new Map(); // contains team scores and statistics

        for (let match of matches) {
            let homeTeam = match.homeTeam;
            let awayTeam = match.awayTeam;

            teamMap.set(homeTeam.id, homeTeam);
            teamMap.set(awayTeam.id, awayTeam);
        }

        for (let teamId of teamMap.keys()) {
            teamStatsMap.set(teamId, {
                teamId: teamId,
                leaguePoints: 0,
                winCount: 0,
                lossCount: 0,
                gamesWon: 0,
                gamesLost: 0,
                matches: []
            });
        }

        for (let match of matches) {
            let teams = [match.homeTeam, match.awayTeam];
            let teamStats = teams.map(team => teamStatsMap.get(team.id));

            let winningSideId = match.getWinningSideId();
            let losingSideId = 1 - winningSideId;

            let winningTeamStats = teamStats[winningSideId];
            let losingTeamStats = teamStats[losingSideId];

            // increase win/loss counters
            ++winningTeamStats.winCount;
            ++losingTeamStats.lossCount;

            // increase points
            winningTeamStats.leaguePoints += match.getTeamPoints(winningSideId);
            losingTeamStats.leaguePoints += match.getTeamPoints(losingSideId);

            // increase games
            let winnerGamesWon = match.getTeamGames(winningSideId);
            let loserGamesWon = match.getTeamGames(losingSideId);
            winningTeamStats.gamesWon += winnerGamesWon;
            winningTeamStats.gamesLost += loserGamesWon;

            losingTeamStats.gamesWon += loserGamesWon;
            losingTeamStats.gamesLost += winnerGamesWon;

            if (isNaN(winningTeamStats.gamesWon) || isNaN(winningTeamStats.gamesLost)) {
                throw new Error('Got NaN while ranking match: ' + match.toString());
            }

            // store the match
            winningTeamStats.matches.push(match);
            losingTeamStats.matches.push(match);
        }

        // copy team IDs into a vector which will be used for ranking
        let rankingVec = Array.from(teamStatsMap.values());
        rankingVec.sort(function (team1Stats, team2Stats) {
            // the function should return a negative number if team1
            // is ranked higher than team 2

            // 1) League points
            let leaguePointDiff = team1Stats.leaguePoints - team2Stats.leaguePoints;
            if (leaguePointDiff != 0) {
                return -leaguePointDiff;
            }

            // 2) Number of victories
            let victoryDiff = team1Stats.winCount - team2Stats.winCount;
            if (victoryDiff != 0) {
                return -victoryDiff;
            }

            // 3) Number of losses
            let lossDiff = team1Stats.lossCount - team2Stats.lossCount;
            if (lossDiff != 0) {
                // the team with less losses should be ranked higher
                return lossDiff;
            }

            // 4) Game difference
            let team1GameDiff = team1Stats.gamesWon - team1Stats.gamesLost;
            let team2GameDiff = team2Stats.gamesWon - team2Stats.gamesLost;
            let gameDiffDiff = team1GameDiff - team2GameDiff;
            if (gameDiffDiff != 0) {
                return -gameDiffDiff;
            }

            // 5) Games won
            let gameDiff = team1Stats.gamesWon - team2Stats.gamesWon;
            if (gameDiff != 0) {
                // the player that won more games should be ranked higher
                return -gameDiff;
            }

            // the teams are tied
            return 0
        })

        return rankingVec;
    }
}
exports.LeagueSorter = LeagueSorter;
