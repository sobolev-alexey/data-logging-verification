const { getUser } = require("../firebase");
const { verifySignature } = require("../encryption");

exports.isAuthorized = async (req, res, next) => {
    try {
        const { uid } = res.locals;
        const params = req.body;
        if (!params || !params.signature || !params.groupId || !params.payload) {
            console.error("Log data failed. Params: ", params);
            return res.status(400).json({ error: "Ensure all fields are included" });
        }


        const user = await getUser(uid);


        // Verify group assignment
        if (!user.groups.includes(params.groupId)) {
            return res.status(403).send({ status: "error", error: 'No access to given group' });
        }

        // Verify signature 
        const signature = Buffer.from(JSON.parse(params.signature));
        const callerSignatureVerificationResult = await verifySignature(user.publicKey, params.payload, signature);
        if (!callerSignatureVerificationResult) {
            return res.status(400).send({ status: "error", error: 'Wrong signature' });
        }

        return next();
    } catch (err) {
        console.error(`${err.code} -  ${err.message}`);
        return res.status(401).send({ message: 'Unauthorized' });
    }
}
