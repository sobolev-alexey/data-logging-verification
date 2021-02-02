const { getUser } = require("../firebase");

exports.isAuthorized = async (req, res, next) => {
    try {
        const { uid } = res.locals;
        const { groupId } = req.body;


        const user = await getUser(uid);


        // Verify group assignment
        if (!user.groups.includes(groupId)) {
            return res.status(403).send({ status: "error", error: 'No access to given group' });
        }

        return next();
    } catch (err) {
        console.error(`${err.code} -  ${err.message}`);
        return res.status(401).send({ message: 'Unauthorized' });
    }
}
