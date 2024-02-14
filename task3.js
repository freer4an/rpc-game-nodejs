const crypto = require('crypto');
const rl = require('readline-sync');
var { AsciiTable3 } = require('ascii-table3');

class KeyGen {
    static generateKey() {
        return crypto.randomBytes(32).toString('hex');
    }
}

class HMAC {
    static generateHMAC(key, text) {
        const hmac = crypto.createHmac('sha3-256', key);
        hmac.update(text);
        return hmac.digest('hex');
    }
}

class Table {
    constructor(moves) {
        this.moves = moves;
        this.totalMoves = moves.length;
        this.table = this.generateTable();
    }

    generateTable() {
        const table = [];
        for (let i = 0; i < this.totalMoves; i++) {
            const row = [this.moves[i]];
            for (let j = 0; j < this.totalMoves; j++) {
                const diff = (i - j + Math.floor(this.totalMoves / 2) + this.totalMoves) % this.totalMoves 
                    - Math.floor(this.totalMoves / 2);
                if (diff === 0) {
                    row.push('Draw');
                } else if (diff > 0) {
                    row.push('Lose');
                } else {
                    row.push('Win');
                }
            }
            table.push(row);
        }
        return table;
    }

    printTable() {
        var table = new AsciiTable3()
            .setHeading('Bot↓ / User→', ...this.moves)
            .addRowMatrix(this.table);
        console.log(table.toString());
    }
}

class Rules {
    static determineWinner(userMoveIndex, botMoveIndex, totalMoves) {
        const p = Math.floor(totalMoves / 2);
        const diff = (userMoveIndex - botMoveIndex + p + totalMoves) % totalMoves - p;
        const result = Math.sign(diff);
        if (result === 0) {
            return 'Draw';
        } else if (result === 1) {
            return 'You win';
        } else {
            return 'Bot wins';
        }
    }
}

const findDuplicates = (arr) => {
    const seen = new Set();
    const duplicates = [];
    arr.forEach((el) => {
        if (seen.has(el)) {
            duplicates.push(el);
        } else {
            seen.add(el);
        }
    });
    return duplicates;
}

class Game {
    constructor(moves) {
        this.moves = moves;
        this.table = new Table(this.moves);
        this.key = KeyGen.generateKey();
        this.validateMoves();
        this.bot_move = this.moves[Math.floor(Math.random() * this.moves.length)];
    }

    validateMoves() {
        if (this.moves.length < 3 || this.moves.length % 2 === 0) {
            console.log(`At least 3 or more odd number of moves are required.\nNow - ${this.moves.length}`);
            process.exit()
        }
        const duplicates = findDuplicates(this.moves);
        if (duplicates.length > 0) {
            console.log(`Duplicate moves found: ${duplicates.join(', ')}`);
            process.exit()
        }        
    }

    get moveHMAC() {
        return HMAC.generateHMAC(this.key, this.bot_move)
    }

    showMenu() {
        console.log("Available moves:")
        this.moves.forEach((el, id) => {
            console.log(`${id + 1} - ${el}`)
        })
        console.log('0 - exit\n? - help')
    }
    
    isValidMove(player_move) {
        if (player_move === '?' || player_move === '0' || isNaN(player_move)) {
            if (player_move === '?') {
                this.table.printTable();
            } else if (player_move === '0') {
                process.exit();
            }
            return false;
        }
        player_move = Number(player_move);
        if (player_move < 1 || player_move > this.moves.length) {
            console.log(`Invalid move. Please enter a number from 1 to ${this.moves.length}`);
            return false
        }
        return true
    }

    play(player_move) {
        while (!this.isValidMove(player_move)) {
            player_move = question();
        }
        player_move = Number(player_move) - 1;
        console.log(`Your move is: ${this.moves[player_move]}`);
        const bot_move = this.moves.indexOf(this.bot_move);
        console.log(`Bot move is: ${this.bot_move}`);
        console.log(Rules.determineWinner(player_move, bot_move, this.moves.length));
        console.log(`HMAC key: ${this.key}`);  
    }
}

const question = () => {
    const answer = rl.question("Your move: ");
    return answer
}

function main() {
    const moves = process.argv.slice(2);
    const game = new Game(moves)
    console.log(`HMAC: ${game.moveHMAC}`);
    game.showMenu();
    const player_move = question();
    game.play(player_move);
}

main()