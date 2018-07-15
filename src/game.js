/**
	Games contain the history of a board and the board itself.

	At time of writing this, the game is also intended to store some
	degree of information regarding the opponents and keys that
	could be used for storage, etc.
*/

import { Board } from './board';
import { EventEmitter } from 'events';
import { SideType } from './piece';
import crypt from 'webcrypto';
let historyIndex = 0;
function addToHistory (game) {
	return function (ev) {
		let
			hashCode = historyIndex++,
			move = new Move(
				ev.prevSquare,
				ev.postSquare,
				ev.capturedPiece,
				ev.algebraic,
				hashCode);

		game.moveHistory.push(move);
	};
}

function denotePromotionInHistory (game) {
	return function () {
		let
			latest = game.moveHistory[
			game.moveHistory.length - 1];

		if (latest) {
			latest.promotion = true;
		}
	};
}

export class Game extends EventEmitter {
	constructor (board) {
		super();

		this.board = board;
		this.moveHistory = [];
	}

	static create () {
		let
			board = Board.create(),
			game = new Game(board);

		// handle move and promotion events correctly
		board.on('move', addToHistory(game));
		board.on('promote', denotePromotionInHistory(game));

		return game;
	}

	getCurrentSide () {
		return this.moveHistory.length % 2 === 0 ?
			SideType.White :
			SideType.Black;
	}

	getHashCode () {
		let
			i = 0,
			sum = crypt.createHash('md5');

		for (i = 0; i < this.board.squares.length; i++) {
			if (this.board.squares[i].piece !== null) {
				sum.update(this.board.squares[i].file +
					this.board.squares[i].rank +
					(this.board.squares[i].piece.side === SideType.White ? 'w' : 'b') +
					this.board.squares[i].piece.notation +
					(i < (this.board.squares.length - 1) ? '-' : ''));
			}
		}

		// generate hash code for board
		return sum.digest('base64');
	}

	static load (moveHistory) {
		let
			board = Board.create(),
			game = new Game(),
			i = 0;

		// handle move and promotion events correctly
		board.on('move', addToHistory(game));
		board.on('promote', denotePromotionInHistory(game));

		// apply move history
		for (i = 0; i < moveHistory.length; i++) {
			board.move(
				board.getSquare(
					moveHistory[i].prevFile,
					moveHistory[i].prevRank),
				board.getSquare(
					moveHistory[i].postFile,
					moveHistory[i].postRank));
		}

		return game;
	}
}

export class Move {
	constructor (originSquare, targetSquare, capturedPiece, notation, hash) {
		this.algebraic = notation;
		this.capturedPiece = capturedPiece;
		this.hashCode = hash;
		this.piece = targetSquare.piece;
		this.promotion = false;
		this.postFile = targetSquare.file;
		this.postRank = targetSquare.rank;
		this.prevFile = originSquare.file;
		this.prevRank = originSquare.rank;
	}
}

export default { Game, Move };
