const fs = require('fs');
const csvParse = require('csv-parse');
const table = require('table').table;

const structs = require('../src/structs/player-structs.js');
const rank = require('../src/cs/ranking.js');


function parseHomeAwayScore(scoreStr) {
    let spl = scoreStr.split(':');
    return {homeGames: parseInt(spl[0]), awayGames: parseInt(spl[1])};
}


function main(argVec) {
    let inputFName = argVec[0];
    let outputFName = argVec[1];

    console.log('ranking file: ' + inputFName);

    let parser = csvParse({columns: true}, function (e, recs) {
        let matches = [];

        for (rec of recs) {
            let homeId = rec['Home Team'];
            let awayId = rec['Away Team'];
            let winnerId = rec['Winner'];
            let scoreStr = rec['Score'];
            let isForfeit = rec['Is Forfeit'] == 'true';

            if (isForfeit && scoreStr == '') {
                // forfeighted before the match
                matches.push(new structs.FinishedMatch(
                    new structs.Team(homeId),
                    new structs.Team(awayId),
                    null,
                    winnerId == homeId ? structs.HomeAway.AWAY : structs.HomeAway.HOME
                ))
            } else {
                // parse the scores
                let setScores = [];
                let scoreArr = scoreStr.split(' ');

                if (scoreArr.length > 0) {
                    let {homeGames, awayGames} = parseHomeAwayScore(scoreArr[0]);
                    setScores.push(new structs.SetScore(homeGames, awayGames));
                }
                if (scoreArr.length > 1) {
                    let {homeGames, awayGames} = parseHomeAwayScore(scoreArr[1]);
                    setScores.push(new structs.SetScore(homeGames, awayGames));
                }
                if (scoreArr.length > 2) {
                    let {homeGames, awayGames} = parseHomeAwayScore(scoreArr[2]);
                    setScores.push(new structs.ExtendedTiebreakScore(homeGames, awayGames));
                }

                matches.push(new structs.FinishedMatch(
                    new structs.Team(homeId),
                    new structs.Team(awayId),
                    setScores,
                    isForfeit ? (winnerId == homeId ? structs.HomeAway.AWAY : structs.HomeAway.HOME) : null
                ))
            }
        }

        let sorter = new rank.LeagueSorter();
        let rankedStats = sorter.rankTeams(matches);

        console.log('RANKING (' + rankedStats.length + ' teams):')
        console.log('rank\tteam\t\t\tpoints\t\twin count\tloss count\tgames won\tgames lost');
        let outputTable = [[
            'rank',
            'team',
            'points',
            'winCount',
            'lossCount',
            'gameDiff',
            'gamesWon',
            'gamesLost'
        ]];
        for (let teamN = 0; teamN < rankedStats.length; ++teamN) {
            let stats = rankedStats[teamN];
            console.log('team: ' + stats.teamId + ', matches: ' + stats.matches.toString());
            outputTable.push([
                teamN + 1,
                stats.teamId,
                stats.leaguePoints,
                stats.winCount,
                stats.lossCount,
                stats.gamesWon - stats.gamesLost,
                stats.gamesWon,
                stats.gamesLost
            ])
        }
        // console.table(teams);
        // for (let teamN = 0; teamN < rankedStats.length; ++teamN) {
        //     let team = rankedStats[teamN];
        //     console.table(team);
        //     // console.log((teamN+1) + '\t' + team.teamId + '\t\t\t' + team.leaguePoints + '\t\t' + team.winCount + '\t' + team.lossCount + '\t' + team.gamesWon + '\t' + team.gamesLost);
        // }
        let output = table(outputTable);
        fs.writeFile(outputFName, output, 'utf8', function (e) {
            if (e != null) {
                console.error('Failed!');
                process.exit(1);
            }
        })
    })

    fs.createReadStream(inputFName).pipe(parser);
}


main(process.argv.slice(2));
