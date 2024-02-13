const { Client } = require('ssh2');

module.exports = function(RED) {
    function SSHInteractiveNode(config) {
        RED.nodes.createNode(this, config);
        var isConnected = false; // Keep track of connection status
        var node = this;

        function connectSSH(sshConfig) {
            var conn = new Client();
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
                });
            }).on('error', (err) => {
                node.error('SSH Client Error: ' + err.toString());
                isConnected = false;
                node.status({fill: "red", shape: "ring", text: "disconnected"});
            }).connect(sshConfig);
        }

        node.on('input', function(msg) {
            // Merge dynamic parameters from msg.payload with static config, prioritizing msg.payload
            const sshConfig = {
                host: msg.payload.host || config.host,
                port: msg.payload.port || config.port || 22, // Use port from msg, then config, or default to 22
                username: msg.payload.username || config.username,
                password: msg.payload.password || config.password // Consider security for password handling
            };

            if (!isConnected) {
                connectSSH(sshConfig); // Connect using prioritized parameters
            }
            // If already connected, you might want to handle additional messages here
        });

        this.on('close', function() {
            // Connection cleanup logic if necessary
        });
    }
    RED.nodes.registerType("ssh-interactive", SSHInteractiveNode,{
        credentials: {
            username: {type:"text"},
            password: {type:"password"}
        }
    });
};
