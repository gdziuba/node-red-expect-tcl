module.exports = function(RED) {
    function SSHConnectionCloserNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;

        node.on('input', function(msg) {
            const globalContext = this.context().global;
            // const conn = globalContext.get('sshClient'); // Assuming the SSH client is stored with this key
            const stream = globalContext.get('sshSession'); // Assuming the interactive shell stream is stored with this key

            if (stream) {
                stream.end('exit\n'); // Properly close the shell session
                globalContext.set('sshSession', null); // Remove the stream from global context
                // node.log("SSH shell stream closed.");
                msg.payload = "SSH connection closed successfully.";
                node.send(msg);
            }

            // if (conn) {
            //     conn.on('close', () => {
            //         node.log("SSH connection closed.");
            //         msg.payload = "SSH connection closed successfully.";
            //         node.send(msg);
            //     }).end(); // Close the connection
            //     globalContext.set('sshClient', null); // Remove the connection from global context
            // } else {
            //     node.warn("No active SSH session found.");
            //     msg.payload = "No active SSH session to close.";
            //     node.send(msg);
            // }
        });
    }
    RED.nodes.registerType("ssh-connection-closer", SSHConnectionCloserNode);
};
