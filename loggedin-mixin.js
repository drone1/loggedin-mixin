/* global LoggedInMixin:true, Roles */

LoggedInMixin = function(methodOptions) {
    check(methodOptions.checkLoggedInError, Match.ObjectIncluding({
        error: String,
        message: Match.Optional(String),
        reason: Match.Optional(String)
    }));

    const rolesPackage = Package['alanning:roles'];
    const runFunc = methodOptions.run;

    methodOptions.run = async function() {
        if (!this.userId) {
            throw new Meteor.Error(..._.values(methodOptions.checkLoggedInError));
        };

        if (methodOptions?.checkHasVerifiedEmail) {
            // We need to manually look up the user
            const user = await Meteor.users.findOneAsync({ _id: this.userId })
            check(user.hasVerifiedEmail(), Boolean)
        }

        // if app is using alanning:roles and method is declaring checkRoles
        const checkRoles = methodOptions.checkRoles;
        if (rolesPackage && checkRoles) {
            // Empty roles are validated to false, undefined validated for true!
            check(checkRoles.roles, [String]);
            // Check rolesError object that contains error code and message
            check(checkRoles.rolesError, Match.ObjectIncluding({
                error: String,
                message: Match.Optional(String),
                reason: Match.Optional(String)
            }));

            const userIsInRoleFunc = Roles?.userIsInRoleAsync || Roles.userIsInRole
            const isInRole = await userIsInRoleFunc(this.userId, checkRoles.roles, checkRoles.group);
            if (!isInRole) {
                throw new Meteor.Error(..._.values(checkRoles.rolesError));
            }
        }
        return await runFunc.call(this, ...arguments);
    }
    return methodOptions;
}
