/* transaction pool miner
    -   mine a transaction in the pool

*/


class Miner {
    constructor({ transactionPool, blockchain, wallet }) {
        this.blockchain = blockchain
        this.transactionPool = transactionPool
        this.wallet = wallet
    }

    mineTransaction(walletId) {
        const pendingTransactions = this.transactionPool.pendingTransactions();
        if(pendingTransactions[0]) {
            const randTransaction = pendingTransactions[Math.floor(Math.random()*pendingTransactions.length)]
            const { sender, recipient, amount } = randTransaction;
            this.blockchain.addBlock({ transaction:randTransaction })
            this.transactionPool.updateTransaction(randTransaction)
            this.wallet.rewardTransaction(walletId)
            return { sender, recipient, amount };
        }
        return null;
    }
}

module.exports = Miner;