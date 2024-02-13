module.exports = function(RED) {
    function SSHCommandExecutorNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;

        node.on('input', function(msg) {
            const stream = this.context().global.get('sshSession');
            if (!stream) {
                node.error("Interactive SSH session not found.");
                return;
            }

            if (msg.payload && msg.payload.command) {
                // Combine commands to ensure 'cd' effect persists for 'ls'
                const commands = Array.isArray(msg.payload.command) ? msg.payload.command.join(' && ') : msg.payload.command;
                const endMarker = `cmd_end_${Math.random().toString(36).substr(2, 9)}`;
                const command = `${commands} ; echo ${endMarker}`;
                let buffer = '';
                let collecting = false;

                const onData = (data) => {
                    const output = data.toString();
                    if (collecting) {
                        if (output.includes(endMarker)) {
                            // End of command output detected
                            stream.removeListener('data', onData); // Clean up listener to prevent memory leak
                            // Remove marker and potential command echoes before sending
                            const cleanOutput = buffer.replace(new RegExp(`${endMarker}|${commands.replace(/&&/g, '')}`, 'g'), '').trim();
                            msg.payload = { result: cleanOutput };
                            node.send(msg);
                            collecting = false; // Reset collecting state
                        } else {
                            buffer += output;
                        }
                    } else if (output.includes(endMarker)) {
                        // This catches the case where the output might start being collected
                        // after the command has already started executing
                        collecting = true;
                    }
                };
                stream.on('data', onData);

                // Write command to the stream, ensuring we start with 'cd' to persist the directory change
                stream.write(`cd $(pwd) && ${command}\n`);
            } else {
                node.warn("No command provided.");
            }
        });
    }
    RED.nodes.registerType("ssh-command-executor", SSHCommandExecutorNode);
};
