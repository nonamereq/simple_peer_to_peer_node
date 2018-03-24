class PeerToPeer{
    constructor(){
        this.ip  = [];
        this.name = '127.0.0.1';
    }

    connect(ip){
        if(this.ip.length < 1){
            this.ip.push(ip);
            return true;
        }
        return false;
    }

}
module.exports = PeerToPeer;
