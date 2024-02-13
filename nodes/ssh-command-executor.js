module.exports = function(RED) {
    function SSHCommandExecutorNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;
        node.disablePagination = config.disablePagination; // Static config for disabling pagination

        node.on('input', function(msg) {
            const stream = this.context().global.get('sshSession');
            if (!stream) {
                node.error("Interactive SSH session not found.");
                return;
            }

            // Determine whether to disable pagination
            // Check msg.payload.more first, then fall back to static config
            const disablePagination = msg.payload.more !== undefined ? msg.payload.more : node.disablePagination;

            if (msg.payload && msg.payload.command) {
                const commands = Array.isArray(msg.payload.command) ? msg.payload.command.join(' && ') : msg.payload.command;
                const endMarker = `cmd_end_${Math.random().toString(36).substr(2, 9)}`;
                let commandToSend = commands;
                
                // If disablePagination is true, prepend 'terminal length 0'
                if (disablePagination === true) {
                    commandToSend = `terminal length 0 && ${commandToSend}`;
                }
                commandToSend += `; echo ${endMarker}\n`; // Append endMarker to the command
                
                let buffer = '';
                let collecting = false;

                const onData = (data) => {
                    const output = data.toString();
                    if (collecting) {
                        if (output.includes(endMarker)) {
                            stream.removeListener('data', onData); // Clean up listener
                            const cleanOutput = buffer.replace(new RegExp(`${endMarker}|${commands.replace(/&&/g, '')}`, 'g'), '').trim();
                            msg.payload = { result: cleanOutput };
                            node.send(msg);
                            collecting = false; // Reset state
                        } else {
                            buffer += output;
                        }
                    } else if (output.includes(endMarker)) {
                        collecting = true;
                    }
                };
                stream.on('data', onData);

                // Write the command to the stream
                stream.write(commandToSend);
            } else {
                node.warn("No command provided.");
            }
        });
    }
    RED.nodes.registerType("ssh-command-executor", SSHCommandExecutorNode);
};
