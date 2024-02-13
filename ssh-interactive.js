const { Client } = require('ssh2');

module.exports = function(RED) {
    function SSHInteractiveNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;
        var conn = new Client();
        var isConnected = false; // Keep track of connection status

        function connectSSH() {
            conn.on('ready', () => {
                node.log('SSH Client Ready');
                isConnected = true;
                node.status({fill: "green", shape: "dot", text: "connected"});
                node.send({payload: "connected"}); // Notify flow of connection

                conn.shell((err, stream) => {
                    if (err) {
                        node.error('SSH Shell Error: ' + err.toString());
                        isConnected = false;
                        node.status({fill: "red", shape: "ring", text: "disconnected"});
                        return;
                    }

                    // Store the stream for later use in the global context
                    node.context().global.set('sshSession', stream);

                    stream.on('close', () => {
                        node.log('SSH session closed');
                        isConnected = false;
                        node.context().global.set('sshSession', null); // Clear the stream from global context
                        node.status({fill: "red", shape: "ring", text: "disconnected"});
                    });

                    // Optionally handle data from the session
                });
            }).on('error', (err) => {
                node.error('SSH Client Error: ' + err.toString());
                isConnected = false;
                node.status({fill: "red", shape: "ring", text: "disconnected"});
            }).connect({
                host: config.host,
                port: 22,
                username: config.username,
                password: config.password // Consider using privateKey for production environments
            });
        }

        node.on('input', function(msg) {
            if (!isConnected) {
                connectSSH(); // Connect if not already connected
            }
            // Handle the input message, possibly executing SSH commands
        });

        this.on('close', function() {
            // Ensure the connection is properly closed when the node is redeployed or Node-RED is stopped
            if (conn && isConnected) {
                conn.end();
            }
        });
    }
    RED.nodes.registerType("ssh-interactive", SSHInteractiveNode);
};
