/* configs file - holds all the chain applications data
    - initial wallet balance
    - genesis block data
    - escape strings
    - wallet and blocks data dir
*/

const path = require('path')

const INITIAL_BALANCE = Number(0.00)
const INITIAL_DIFFICULTY = 4;
const MINE_RATE = 1000;
const WALLETS_DIR = path.dirname(__filename).split('src')[0]+'chaindata/wlt/'
const BLOCKS_DIR = path.dirname(__filename).split('src')[0]+'chaindata/data/'
const ESC_STR = ' *::* '
const TOTAL_SUPPLY = Number(100000000000);
const INITIAL_VALUE_USD = Number(0.67);
const REWARD_VALUE = Number(0.05);

const GENESIS_BLOCK = {
    timestamp: '----',
    lastHash: 'h45h-1',
    hash: 'f1r57-h45h',
    difficulty: INITIAL_DIFFICULTY,
    nonce: 0,
    data: []
}

module.exports = { 
    GENESIS_BLOCK, 
    ESC_STR,
    INITIAL_BALANCE,
    WALLETS_DIR,
    BLOCKS_DIR,
    TOTAL_SUPPLY,
    INITIAL_VALUE_USD,
    INITIAL_DIFFICULTY,
    MINE_RATE,
    REWARD_VALUE
}