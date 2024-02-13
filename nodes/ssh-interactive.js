const { Client } = require('ssh2');

module.exports = function(RED) {
    function SSHInteractiveNode(config) {
        RED.nodes.createNode(this, config);
        var isConnected = false; // Keep track of connection status
        var node = this;
        var statusInterval;
        var enableLogging = config.enableLogging;

        function updateNodeStatus() {
            if (isConnected) {
                node.status({fill: "green", shape: "dot", text: "connected"});
            } else {
                node.status({fill: "red", shape: "ring", text: "disconnected"});
            }
        }

        function connectSSH(sshConfig, msg) {
            var conn = new Client();

            // Dynamically set the KEX algorithms if specified in the message payload
            // or use a sensible default that includes both secure and compatible options
            const defaultKexAlgorithms = [
                'curve25519-sha256',
                'ecdh-sha2-nistp256',
                'diffie-hellman-group-exchange-sha256',
                'diffie-hellman-group14-sha1', // For compatibility with older devices
                'diffie-hellman-group-exchange-sha1' // Least secure, included for compatibility
            ];
            sshConfig.algorithms = sshConfig.algorithms || {};
            sshConfig.algorithms.kex = msg.payload.kexAlgorithms || defaultKexAlgorithms;

            // Custom SSH configurations, e.g., to ignore strict host key checking
            if (config.ignoreHostKey || msg.payload.ignoreHostKey) {
                sshConfig.hostHash = 'sha256'; // ssh2 requires hostHash if hostVerifier is used
                sshConfig.hostVerifier = (hashedKey, callback) => callback(true);
            }

            conn.on('ready', () => {
                isConnected = true;
                updateNodeStatus();
                if (enableLogging) {
                    node.log('SSH Connection Established');
                }

                conn.shell((err, stream) => {
                    if (err) {
                        node.error('SSH Shell Error: ' + err.toString());
                        isConnected = false;
                        updateNodeStatus();
                        return;
                    }

                    if (enableLogging) {
                        node.log('SSH Shell Opened');
                    }

                    let buffer = ''; // Use a buffer to accumulate data
                    let initialOutput = '';

                    stream.on('data', (data) => {
                        let output = data.toString();
                        initialOutput += data.toString();
                        buffer += output;

                        // Check for password prompt using case-insensitive regex
                        if (/password:/i.test(buffer)) {
                            // Extract the password from config or msg.payload
                            let password = msg.payload.password2 || config.password;

                            if (password) {
                                stream.write(password + '\n');
                                buffer = ''; // Clear buffer after sending password
                                if (enableLogging) {
                                    node.log('Password submitted to SSH session');
                                }
                            } else {
                                node.warn('Password prompt detected but no password provided.');
                            }
                        }
                    }).on('close', () => {
                        isConnected = false;
                        updateNodeStatus(); // Update status immediately upon disconnection
                    });

                    // Delay sending the initial output to ensure collection of data
                    setTimeout(() => {
                        msg.payload = initialOutput;
                        node.send(msg); // Send the initial collected output in msg.payload
                    }, 1000); // Adjust delay as necessary based on expected output timing

                    // Store the stream for later use in the global context
                    node.context().global.set('sshSession', stream);
                });
            }).on('error', (err) => {
                isConnected = false;
                updateNodeStatus();
                if (enableLogging) {
                    node.error('SSH Connection Error: ' + err.toString());
                }
            });

            // Connect with the prepared sshConfig
            conn.connect(sshConfig);
        }

        // Initialize and clear the status check interval
        function initStatusCheck() {
            if (statusInterval) clearInterval(statusInterval);
            statusInterval = setInterval(updateNodeStatus, 5000); // Check every 5 seconds
        }

        node.on('input', function(msg) {
            const dynamicPrivateKey = msg.payload.privateKey ? msg.payload.privateKey.replace(/\\n/g, '\n') : null;
            const staticPrivateKey = config.privateKey ? config.privateKey.replace(/\\n/g, '\n') : null;

            // Prepare sshConfig with host, port, username, password, privateKey, and passphrase
            const sshConfig = {
                host: msg.payload.host || config.host,
                port: msg.payload.port || config.port || 22,
                username: msg.payload.username || config.username,
                password: msg.payload.password || config.password,
                privateKey: dynamicPrivateKey ? Buffer.from(dynamicPrivateKey, 'utf-8') : (staticPrivateKey ? Buffer.from(staticPrivateKey, 'utf-8') : undefined),
                passphrase: msg.payload.passphrase || config.passphrase
            };

            if (!isConnected) {
                connectSSH(sshConfig, msg); // Connect using prioritized parameters
                initStatusCheck(); // Initialize the status check upon new connection
            }
        });

        this.on('close', function() {
            if (statusInterval) clearInterval(statusInterval); // Clear interval on node close
            isConnected = false;
            updateNodeStatus(); // Ensure status is updated when node is closed
        });
    }
    RED.nodes.registerType("ssh-connection-open", SSHInteractiveNode, {
        credentials: {
            username: {type: "text"},
            password: {type: "password"},
            passphrase: {type: "password"},
            privateKey: {type: "text"}
        }
    });
};
