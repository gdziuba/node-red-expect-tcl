module.exports = function(RED) {
    function ExtractLastNLinesNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;
        node.numberOfLines = config.numberOfLines; // Number of lines to extract from the end

        node.on('input', function(msg) {
            let numberOfLines = node.numberOfLines; // Use the configured number of lines

            // Check if msg.payload.result is a string and has content
            if (typeof msg.payload.result === 'string' && msg.payload.result.length > 0) {
                // Normalize line endings to \n then split into lines
                let lines = msg.payload.result.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
                // Filter out empty lines if necessary
                lines = lines.filter(line => line.trim().length > 0);

                if (numberOfLines === 'all') {
                    // Return all lines
                    msg.payload = lines.join('\n');
                } else {
                    // Convert numberOfLines to a number in case it's passed as a string
                    numberOfLines = parseInt(numberOfLines, 10);
                    // Return the last 'numberOfLines' lines
                    msg.payload = lines.slice(-numberOfLines).join('\n');
                }
            } else {
                // If msg.payload.result is not a string or is empty, set an appropriate message
                msg.payload = "Payload.result is not a string or is empty";
            }

            node.send(msg); // Return the modified message object
        });
    }
    RED.nodes.registerType("extract-last-n-lines", ExtractLastNLinesNode);
};
