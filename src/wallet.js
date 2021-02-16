/* wallet class - handles all wallet level functions
    - createNewWallet
    - calculateWalletBalance
    - signTransaction
    - verifyTransaction
*/

const { generateKeyPair } = require("crypto");
const NodeRSA = require("node-rsa");
const { INITIAL_BALANCE, WALLETS_DIR, REWARD_VALUE } = require("./config");
const { newWalletId, saveWalletData, utils, updateWalletBalance, signTransaction, uuidV1 } = require("./utils");

class Wallet {
    constructor() {
        this.wallets = []
        this.loadWallets();
    }

    createNewWallet() {
        let walletId, publicKey, privateKey, balance;
        walletId = newWalletId();
        generateKeyPair("rsa",{
            modulusLength: 2048,
            publicKeyEncoding:{ type:'pkcs1',format:"pem" },
            privateKeyEncoding:{ type:'pkcs1',format:"pem" }
        },(err,PUB,PRI)=>{
            if(err) console.log(err);
            // Init wallet vars
            publicKey = PUB
            privateKey = PRI
            balance = INITIAL_BALANCE
            saveWalletData({
                dataToWrite: privateKey,
                walletId
            })
            this.wallets.push({ id:walletId, publicKey, privateKey, balance })
        })
        return walletId
    }

    loadWallets() {
        this.wallets = [];
        utils.readdir(WALLETS_DIR, (err, locals)=>{
            if(err) console.log(err);
            // init vars
            if(locals[0]){
                locals.forEach((local,index)=>{
                    let id = local.split('__')[0]
                    if(index % 2) {
                        this.initWallet({ id })
                    }
                })
            }
        })
    }

    initWallet({ id }) {
        let walletId = id;
        let publicKey, privateKey, balance
        utils.readFile(WALLETS_DIR+`${id}__key.txt`,(err,keyData)=>{
            if(err) console.log(err);
            // init vars
            const keyPair = new NodeRSA()
            keyPair.importKey(keyData, 'pkcs1')
            publicKey = keyPair.exportKey('pkcs1-public-pem')
            privateKey = keyPair.exportKey('pkcs1-pem')
            utils.readFile(WALLETS_DIR+`${id}__bal.txt`,(err,data)=>{
                if(err) console.log(err);
                // init vars
                balance = Number(parseFloat(data.toString()).toFixed(2))
                this.wallets.push({ id:walletId,publicKey,privateKey,balance });
            })
        })
    }

    fetchWallet (walletId) {
        return this.wallets.find(w => w.id === walletId);
    }

    static newTransactionMap({ senderWallet, transaction }) {
        let { sender, recipient, amount } = transaction;
        return {
            id: uuidV1(),
            timestamp: Date.now(),
            sender,
            recipient,
            amount,
            signature: signTransaction({ senderWallet, transaction})
        }
    }

    updateBalance({ transaction }) {
        let sender = this.fetchWallet(transaction.sender);
        let recipient = this.fetchWallet(transaction.recipient);
        let amount = Number(transaction.amount)
        updateWalletBalance({
            walletId:sender.id, 
            newBalance: Number(sender.balance - amount)
        })
        updateWalletBalance({
            walletId:recipient.id, 
            newBalance: Number(recipient.balance + amount)
        })
        this.loadWallets();
    }

    rewardTransaction(walletId) {
        const wallet = this.fetchWallet(walletId);
        updateWalletBalance({
            walletId,
            newBalance: Number(wallet.balance + REWARD_VALUE)
        })
    }

    toString() {
        return this.wallets
    }

    getCurrentSupply() {
        let totalSupply = 0;
        this.wallets.forEach(wallet => {
            totalSupply += wallet.balance
        })
        return totalSupply;
    }

}

module.exports = Wallet;