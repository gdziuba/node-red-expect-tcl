module.exports = function(RED) {
    function StringSearchNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;
        node.searchString = config.searchString; // The string to search for

        node.on('input', function(msg) {
            let searchString = node.searchString;

            // Check if the search string is found within msg.payload
            if (typeof msg.payload === 'string' && msg.payload.includes(searchString)) {
                node.send([msg, null]); // String found: output to the first output
            } else {
                node.send([null, msg]); // String not found: output to the second output
            }
        });
    }
    RED.nodes.registerType("string-search", StringSearchNode);
};
