/* handles all transaction pool level functions
    - add new transaction in the pool
    - remove transaction from the pool
*/

const { POOL_DIR } = require("./config");
const Transaction = require("./transaction");
const { utils, newLocalPool, updateLocalPool } = require("./utils");

class TransactionPool {
    constructor({ wallet, transaction }) {
        this.transactionPool = {}
        this.wallet = wallet
        this.transaction = transaction
        this.loadTransactionPool()
    }

    clear() {
        this.transactionPool = {}
    }

    addTransaction(transaction, ext=null) {
        if(!this.transactionPool[transaction.id]){
            this.transactionPool[transaction.id] = transaction;
            if(ext == null) {
                newLocalPool(transaction)
            }
        }
    }

    updateTransaction(transaction) {
        this.transactionPool[transaction.id].status = 'completed';
        updateLocalPool(this.transactionPool[transaction.id])
    }

    removeTranaction(param) {
        let obj = Object.values(this.transactionPool).filter(tr => tr.id === param.id)
        obj.forEach(tr => this.addTransaction(tr))
        updateLocalPool(param, 1);
        return true
    }

    loadTransactionPool() {
        let path = POOL_DIR+'tp.dat';
        utils.readFile(path, (err,data)=>{
            if(!err) {
                const ln = data.toString().split(/\r?\n/)
                if(ln[0]!=''){
                    ln.forEach(param=>{
                        let tr =  param != '' ? JSON.parse(param) : undefined
                        if(tr && !this.transactionPool[tr.id]){
                            this.addTransaction(tr, 1)
                        }
                    })
                }
            }else console.log(err);
        })
    }

    validTransactions() {
        return Object.values(this.transactionPool).filter(
            tr => {
                let senderWallet = this.wallet.fetchWallet(tr.sender);
                if(this.transaction.validTransaction(senderWallet, tr)) return true
                return false
            }
        )
    }

    pendingTransactions() {
        return Object.values(this.transactionPool).filter(
            tr => {
                let senderWallet = this.wallet.fetchWallet(tr.sender);
                if(tr.status === 'pending')
                    if(this.transaction.validTransaction(senderWallet, tr)) return true
                return false
            }
        )
    }
}

module.exports = TransactionPool;