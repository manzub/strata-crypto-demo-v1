// root application server api
// handles all route requests to api

// after create transaction call wallet.updateBalance on the transaction.

const express = require("express")
const bodyParser = require("body-parser")
const Blockchain = require("./src/blockchain");
const Wallet = require("./src/wallet");
const Transaction = require("./src/transaction");
const TransactionPool = require("./src/transaction-pool");
const Miner = require("./src/miner")
const { TOTAL_SUPPLY, INITIAL_VALUE_USD } = require("./src/config");
let LAST_SUPPLY = 0;
const { default: axios } = require("axios");
const {utils} = require("./src/utils");

const app = express();
app.use(bodyParser.json())

const blockchain = new Blockchain()
const wallet = new Wallet();
const transaction = new Transaction();
const transactionPool = new TransactionPool({wallet, transaction})
const miner = new Miner({ transactionPool, blockchain, wallet })
let CURRENT_SUPPLY;
setTimeout(() => {
    CURRENT_SUPPLY = wallet.getCurrentSupply();
}, 100);
const PORT = 3001 || process.env.PORT
const ROOT_ADDR = `http://localhost:${PORT}`
function initCoinValue() {
    utils.readFile("chaindata/__.dat",(err,data)=>{
        if(err) console.log(err);
        // init  vars
        const line = data.toString().split(/\r?\n/)
        LAST_SUPPLY = Number(line[1]);
        let lastDate = new Date(line[0])
        let newDate = new Date()
        let diff_in_time = newDate.getTime() - lastDate.getTime()
        let diff_in_days = diff_in_time / (1000 * 3600 * 24)
        if(diff_in_days >= 1) {
            let lineToWrite = `${newDate}\n${CURRENT_SUPPLY}`;
            utils.writeFile("chaindata/__.dat", lineToWrite, (err)=>{if(err)console.log(err);})
        }
    }) 
    setTimeout(initCoinValue, 360000);
}
initCoinValue()


app.get("/api/wallets", (req, res)=>{
    wallet.loadWallets();
    setTimeout(() => {
        res.json(wallet)
    }, 100);
})

app.post("/api/wallet-info", (req, res)=>{
    const { id } = req.body
    let w = wallet.fetchWallet(id)
    const obj = {
        address: w.id,
        balance: w.balance
    }
    res.json(obj);
})

app.get("/api/value", (req, res)=>{
    let increase = CURRENT_SUPPLY - LAST_SUPPLY;
    let percent = increase / LAST_SUPPLY;
    let value = Number(INITIAL_VALUE_USD + percent).toFixed(2)
    res.json({
        currentValue: `$${value}`,
        percentIncrease:`${Math.round(percent*100)}%`
    });
})

app.get("/api/blocks", (req, res)=>{
    res.json(blockchain.chain)
})

app.get("/api/transactions", (req, res)=>{
    res.json(transactionPool.transactionPool)
})

app.post('/api/new-wallet', (req, res)=>{
    let newWallet = wallet.createNewWallet();
    setTimeout(() => {
        axios.post(ROOT_ADDR+'/api/wallet-info',{id:newWallet}).then(response=>{
            res.json(response.data)
        })
    }, 100);
})

app.post('/api/create-transaction', (req, res)=>{
    const { sender, recipient } = req.body
    let amount = Number(req.body.amount)
    let t = transaction.createTransaction({
        sender:wallet.fetchWallet(sender),
        recipient:wallet.fetchWallet(recipient),
        amount
    })
    transactionPool.addTransaction(t)
    res.json('New Transaction Added')
})

app.post('/api/mine-transactions', (req, res)=>{
    const {walletId} = req.body
    const mineT = miner.mineTransaction(walletId)
    const { sender, recipient, amount } = mineT
    wallet.updateBalance({transaction:{ sender, recipient, amount }})
    res.redirect("/api/blocks")
})


app.listen(PORT, ()=>console.log(`listening on http://localhost:3001`))