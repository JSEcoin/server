/**
 * @module jseASCII
 * @description ASCII artwork for the start screen and server home page
 * <br><pre>
 *
 *                OOOOO
 *            OOOOO   OOOOO
 *           OOO         OOO
 *        o  OOO         OOO  o
 *      o    OOO         OOO    o
 *     o     OOO         OOO     o
 *            OOOOO   OOOOO
 *       OOOOO    OOOOO    OOOOO
 *   OOOOO   OOOOO     OOOOO   OOOOO
 *  OOO         OOO   OOO         OOO
 *  OOO         OOO   OOO         OOO
 *  OOO         OOO   OOO         OOO
 *  OOO         OOO   OOO         OOO
 *   OOOOO   OOOOO     OOOOO   OOOOO
 *       OOOOO             OOOOO
 *               o  o  o
 * </pre>
 */
const JSE = global.JSE;

/**
 * @const <h2>jseASCII</h2>
 * @description Icon and logo in ASCII, JSE.version is inserted dynamically
 */
const jseASCII = `
#####################################
#                                   #
#               OOOOO               #
#           OOOOO   OOOOO           #
#          OOO         OOO          #
#       o  OOO         OOO  o       #
#     o    OOO         OOO    o     #
#    o     OOO         OOO     o    #
#           OOOOO   OOOOO           #
#      OOOOO    OOOOO    OOOOO      #
#  OOOOO   OOOOO     OOOOO   OOOOO  #
# OOO         OOO   OOO         OOO #
# OOO         OOO   OOO         OOO #
# OOO         OOO   OOO         OOO #
# OOO         OOO   OOO         OOO #
#  OOOOO   OOOOO     OOOOO   OOOOO  #
#      OOOOO             OOOOO      #
#              o  o  o              #
#                                   #
#        _ ___ ___        _         #
#     _ | | __| __|__ ___(_)___     #
#    | || |__ | _|  _| _ | |   |    #
#    |____|___|___|__|___|_|_|_|    #
#                                   #
#              v${JSE.version}               #
#                                   #
#####################################
`;

module.exports = jseASCII;
