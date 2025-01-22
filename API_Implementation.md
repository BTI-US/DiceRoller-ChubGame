## Action Table

| Name | Is Used | Description |
| --- | --- | --- |
| **GET** | Yes | Retrieve a users current balance. |
| **CREDIT** | Yes | Add points to a users current balance. |
| **DEBIT** | Yes | Deduct points from a users balance. |
| **PAY** | No | Transfer points from one user to another. |

## Hook Initialization for myCred

```php
/**
 * Custom Hook: Dice Game Points
 * This hook handles participation, win, and loss in a single function.
 */
add_action( 'mycred_setup_hooks', 'mycredpro_register_dice_game_hook' );
function mycredpro_register_dice_game_hook( $installed ) {

    $installed['dice_game'] = array(
        'title'       => __( '%plural% for Dice Game', 'mycredcu' ),
        'description' => __( 'Award %_plural% points based on participation, winning, and losing in the dice game.', 'mycredcu' ),
        'callback'    => array( 'myCRED_Hook_Dice_Game' )
    );

    return $installed;
}

/**
 * Custom Hook: Load Dice Game Hook
 */
add_action( 'mycred_load_hooks', 'mycredpro_load_dice_game_hook', 10 );
function mycredpro_load_dice_game_hook() {

    class myCRED_Hook_Dice_Game extends myCRED_Hook {

        /**
         * Construct
         */
        function __construct( $hook_prefs, $type = 'mycred_default' ) {
            parent::__construct( array(
                'id'       => 'dice_game',
                'defaults' => array(
                    'participation_points' => 10,  // Fixed points for participation
                    'win_points'           => 10,  // Default win points
                    'win_points_max'       => 5000,  // Max win points
                    'win_points_min'       => 5,   // Min win points
                    'loss_points'          => 10,  // Default loss points
                    'loss_points_max'      => 5000,  // Max loss points
                    'loss_points_min'      => 5,   // Min loss points
                    'log'                  => '%plural% for playing the dice game'
                )
            ), $hook_prefs, $type );
        }

        /**
         * Run the hook
         */
        public function run() {
            add_action( 'dice_game_event', array( $this, 'handle_dice_game_event' ), 10, 3 );
        }

        /**
         * Handle Dice Game Event
         * Handles all actions: participation, win, loss
         */
        public function handle_dice_game_event( $user_id, $result ) {
            // Ensure that the user is not excluded
            if ( $this->core->exclude_user( $user_id ) === true ) return;

            // Handle participation (always happens)
            $this->award_participation_points( $user_id );

            // Handle win or loss based on the game result
            if ( $result == 'win' ) {
                $this->award_win_points( $user_id );
            } elseif ( $result == 'loss' ) {
                $this->deduct_loss_points( $user_id );
            }
        }

        /**
         * Award Participation Points
         */
        private function award_participation_points( $user_id ) {
            $points = $this->prefs['participation_points'];

            // Add points for participation
            $this->core->add_creds(
                'dice_game_participation',
                $user_id,
                $points,
                $this->prefs['log'],
                0,
                array( 'ref_type' => 'dice_game_participation' ),
                $this->mycred_type
            );
        }

        /**
         * Award Win Points - Handled by external script
         */
        private function award_win_points( $user_id ) {
            // Get win points from the external script or default to 10
            $points = apply_filters( 'dice_game_win_points', 10 );

            // Clamp points to max/min limits
            $points = $this->clamp_points($points, 'win');

            // Add points for winning
            $this->core->add_creds(
                'dice_game_win',
                $user_id,
                $points,
                $this->prefs['log'],
                0,
                array( 'ref_type' => 'dice_game_win' ),
                $this->mycred_type
            );
        }

        /**
         * Deduct Loss Points - Handled by external script
         */
        private function deduct_loss_points( $user_id ) {
            // Get loss points from the external script or default to 10
            $points = apply_filters( 'dice_game_loss_points', 10 );

            // Clamp points to max/min limits
            $points = $this->clamp_points($points, 'loss');

            // Get the user's current balance
            $current_balance = $this->core->get_users_balance( $user_id );

            // Check if the player has enough points
            if ( $current_balance < $points ) {
                return new WP_REST_Response(array('valid' => false, 'error' => 'Not enough points to cover the loss'), 400);
            }

            // Deduct points for losing
            $this->core->add_creds(
                'dice_game_loss',
                $user_id,
                -$points,  // Negative for deduction
                $this->prefs['log'],
                0,
                array( 'ref_type' => 'dice_game_loss' ),
                $this->mycred_type
            );
        }

        /**
         * Clamp Points to Max/Min Limits
         * 
         * @param int $points The points to be clamped.
         * @param string $type The type of points, either 'win' or 'loss'.
         * @return int The clamped points.
         */
        private function clamp_points( $points, $type ) {
            $min = isset($this->prefs["{$type}_points_min"]) ? $this->prefs["{$type}_points_min"] : 0;
            $max = isset($this->prefs["{$type}_points_max"]) ? $this->prefs["{$type}_points_max"] : PHP_INT_MAX;

            return max($min, min($points, $max));
        }

        /**
         * Preferences Page
         * Define the settings for the hook.
         */
        public function preferences() {
            $prefs = $this->prefs;
            ?>
            <label class="subheader"><?php _e( 'Participation Points', 'mycredcu' ); ?></label>
            <ol>
                <li>
                    <div class="h2"><input type="number" name="<?php echo $this->field_name( 'participation_points' ); ?>" value="<?php echo esc_attr( $prefs['participation_points'] ); ?>" class="long" /></div>
                </li>
            </ol>

            <label class="subheader"><?php _e( 'Win Points', 'mycredcu' ); ?></label>
            <ol>
                <li>
                    <div class="h2">
                        <input type="number" name="<?php echo $this->field_name( 'win_points' ); ?>" value="<?php echo esc_attr( $prefs['win_points'] ); ?>" class="long" />
                        <p class="description"><?php _e( 'Default Win Points for a win. This is the base value unless a filter is applied.', 'mycredcu' ); ?></p>
                    </div>
                </li>
                <li>
                    <div class="h2">
                        <input type="number" name="<?php echo $this->field_name( 'win_points_max' ); ?>" value="<?php echo esc_attr( $prefs['win_points_max'] ); ?>" class="long" placeholder="Max Win Points" />
                        <p class="description"><?php _e( 'Maximum points a user can earn for winning. Adjust this value to limit the win points.', 'mycredcu' ); ?></p>
                    </div>
                </li>
                <li>
                    <div class="h2">
                        <input type="number" name="<?php echo $this->field_name( 'win_points_min' ); ?>" value="<?php echo esc_attr( $prefs['win_points_min'] ); ?>" class="long" placeholder="Min Win Points" />
                        <p class="description"><?php _e( 'Minimum points a user can earn for winning. Adjust this value to set the lower limit for win points.', 'mycredcu' ); ?></p>
                    </div>
                </li>
            </ol>

            <label class="subheader"><?php _e( 'Loss Points', 'mycredcu' ); ?></label>
            <ol>
                <li>
                    <div class="h2">
                        <input type="number" name="<?php echo $this->field_name( 'loss_points' ); ?>" value="<?php echo esc_attr( $prefs['loss_points'] ); ?>" class="long" />
                        <p class="description"><?php _e( 'Default Loss Points for a loss. This is the base value unless a filter is applied.', 'mycredcu' ); ?></p>
                    </div>
                </li>
                <li>
                    <div class="h2">
                        <input type="number" name="<?php echo $this->field_name( 'loss_points_max' ); ?>" value="<?php echo esc_attr( $prefs['loss_points_max'] ); ?>" class="long" placeholder="Max Loss Points" />
                        <p class="description"><?php _e( 'Maximum points a user can lose. Adjust this value to limit the loss points.', 'mycredcu' ); ?></p>
                    </div>
                </li>
                <li>
                    <div class="h2">
                        <input type="number" name="<?php echo $this->field_name( 'loss_points_min' ); ?>" value="<?php echo esc_attr( $prefs['loss_points_min'] ); ?>" class="long" placeholder="Min Loss Points" />
                        <p class="description"><?php _e( 'Minimum points a user can lose. Adjust this value to set the lower limit for loss points.', 'mycredcu' ); ?></p>
                    </div>
                </li>
            </ol>

            <label class="subheader"><?php _e( 'Log Template', 'mycredcu' ); ?></label>
            <ol>
                <li>
                    <div class="h2"><input type="text" name="<?php echo $this->field_name( 'log' ); ?>" value="<?php echo esc_attr( $prefs['log'] ); ?>" class="long" /></div>
                </li>
            </ol>
            <?php
        }
    }

}

```

### Database Initialization

Modify the table schema to track the relationships between parent and child users:

```php
function create_dice_data_table() {
    global $wpdb;
    $table_name = $wpdb->prefix . 'dice_data';
    $charset_collate = $wpdb->get_charset_collate();

    $sql = "CREATE TABLE $table_name (
        id mediumint(9) NOT NULL AUTO_INCREMENT,
        user_id bigint(20) NOT NULL,
        dice_amount int(11) NOT NULL,
        total_points int(11) NOT NULL,
        promotion_code varchar(16) NOT NULL,
        is_promotion_user tinyint(1) NOT NULL,
        chips int(11) NOT NULL,
        deduct_chips int(11) NOT NULL DEFAULT 0,
        increase_chips int(11) NOT NULL DEFAULT 0,
        total_chips int(11) NOT NULL,
        parent_user_id bigint(20) DEFAULT NULL,
        child_user_id bigint(20) DEFAULT NULL,
        created_at datetime DEFAULT CURRENT_TIMESTAMP NOT NULL,
        PRIMARY KEY  (id),
        KEY user_id_idx (user_id),
        KEY promotion_code_idx (promotion_code),
        FOREIGN KEY (parent_user_id) REFERENCES {$wpdb->prefix}users(ID) ON DELETE CASCADE,
        FOREIGN KEY (child_user_id) REFERENCES {$wpdb->prefix}users(ID) ON DELETE CASCADE
    ) $charset_collate;";

    require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
    dbDelta($sql);
}

register_activation_hook(__FILE__, 'create_dice_data_table');
```

### Promotion Code Validation Script

Modify the `handle_validate_promotion_code` function to relate the parent user with the promotion code:

```php
add_action('rest_api_init', function () {
    register_rest_route('chubgame/v1', '/validate', array(
        'methods' => 'POST',
        'callback' => 'handle_validate_promotion_code',
        'permission_callback' => 'check_if_user_logged_in',
    ));
});

function handle_validate_promotion_code(WP_REST_Request $request) {
    global $wpdb;

    $promotion_code = $request->get_param('promotionCode');
    $username = $request->get_param('username');

    // Debug: Log received parameters
    error_log("handle_validate_promotion_code: Received promotion code: $promotion_code, username: $username");

    // Check if the parameters are provided
    if (empty($promotion_code) || empty($username)) {
        error_log("handle_validate_promotion_code: Missing parameters (promotion code or username).");
        $error = new WP_Error(400, 'Promotion code and username are required.', array('status' => 'missing_parameters'));
        return new WP_REST_Response($error, 400);
    }

    // Get child user ID
    $child_user = get_user_by('login', $username);
    if (!$child_user) {
        error_log("handle_validate_promotion_code: No user found with username $username");
        $error = new WP_Error(404, 'Invalid username', array('status' => 'no_user'));
        return new WP_REST_Response($error, 404);
    }
    $child_user_id = $child_user->ID;
    error_log("handle_validate_promotion_code: Child user ID for username $username is $child_user_id");

    // Validate promotion code and fetch parent user where the user is the promotion code generator
    $table_name = $wpdb->prefix . 'dice_data';
    $result = $wpdb->get_row($wpdb->prepare(
        "SELECT * FROM $table_name WHERE promotion_code = %s AND is_promotion_user = 1",
        $promotion_code
    ));

    if (!$result) {
        error_log("handle_validate_promotion_code: Invalid promotion code or no promotion code generator found for code $promotion_code");
        $error = new WP_Error(400, 'Invalid promotion code', array('status' => 'invalid_promotion_code'));
        return new WP_REST_Response($error, 400);
    }

    // Check if the promotion code has already been used
    $used_result = $wpdb->get_row($wpdb->prepare(
        "SELECT * FROM $table_name WHERE promotion_code = %s AND parent_user_id IS NOT NULL AND child_user_id IS NOT NULL",
        $promotion_code
    ));

    if ($used_result) {
        error_log("handle_validate_promotion_code: Promotion code $promotion_code has already been used.");
        $error = new WP_Error(400, 'This promotion code has already been used', array('status' => 'promotion_code_used'));
        return new WP_REST_Response($error, 400);
    }

    // If valid, associate the parent and child users
    $wpdb->update($table_name, array(
        'parent_user_id' => $result->user_id
    ), array('id' => $result->id));

    error_log("handle_validate_promotion_code: Parent user ID {$result->user_id} associated with child user ID $child_user_id");

    return new WP_REST_Response(array(
        'code' => 200,
        'message' => 'Promotion code is valid and successfully applied.',
        'data' => array(
            'status' => 'success',
            'valid' => true,
            'parent_user_id' => $result->user_id,
            'parent_dice_amount' => $result->dice_amount // Include parent dice amount
        )
    ), 200);
}

```

### Balance Validation Script

```php
add_action('rest_api_init', function () {
    register_rest_route('chubgame/v1', '/check-balance', array(
        'methods' => 'POST',
        'callback' => 'handle_check_balance',
        'permission_callback' => 'check_if_user_logged_in',
    ));
});

function handle_check_balance(WP_REST_Request $request) {
    global $wpdb;

    // Get the request parameters
    $username = $request->get_param('username');
    $chips = $request->get_param('chips'); // The chips (bet amount) to be checked

    // Log the request parameters for debugging
    error_log("Check Balance Request: username={$username}, chips={$chips}");

    // Check if the parameters are provided
    if (empty($username) || empty($chips)) {
        error_log("Error: Missing parameters (username or chips).");

        $error = new WP_Error(400, 'Username and chips are required.', array('status' => 'missing_parameters'));
        return new WP_REST_Response($error, 400);
    }

    // Get the user by their username
    $user = get_user_by('login', $username);
    if (!$user) {
        error_log("Error: No user found for username {$username}.");

        $error = new WP_Error(404, 'Invalid username', array('status' => 'no_user'));
        return new WP_REST_Response($error, 400);
    }
    $user_id = $user->ID;
    error_log("User found: {$username}, user_id={$user_id}");

    // Get the current balance for the user
    $current_balance = mycred_get_users_balance($user_id);
    error_log("Current balance for user_id {$user_id}: {$current_balance}");

    // Check if the user's balance is greater than or equal to the deducted chips
    if ($current_balance >= $chips) {
        // Balance is sufficient, return success
        error_log("Balance is sufficient for {$username} (user_id={$user_id}). Returning success.");
        return new WP_REST_Response(array(
            'code' => 200,
            'message' => 'Balance is sufficient for current user',
            'data' => array(
                'status' => 'success',
                'balance' => $current_balance
            )
        ), 200);
    } else {
        $error = new WP_Error(400, 'Insufficient balance for parent user', array(
            'status' => 'insufficient_balance',
            'balance' => $current_balance,
            'requested_chips' => $chips
        ));
        error_log("Error: Insufficient balance for parent user");
        return new WP_REST_Response($error, 400);
    }
}

```

### Dice Data and Manage Chips Script

Update the `handle_send_dice_data` function to:

1. Deduct chips from the parent and child wallets using **myCRED**.
2. Determine the winner and distribute chips accordingly.
3. Deduct a 0.5% service charge.
4. Each promotion code can be used for ONLY ONCE!
5. 

```php
add_action('rest_api_init', function () {
    register_rest_route('chubgame/v1', '/send', array(
        'methods' => 'POST',
        'callback' => 'handle_send_dice_data',
        'permission_callback' => 'check_if_user_logged_in',
    ));
});

function check_if_user_logged_in() {
    return is_user_logged_in();
}

function handle_send_dice_data(WP_REST_Request $request) {
    global $wpdb;

    // Extract request parameters
    $dice_amount = $request->get_param('diceAmount');
    $total_points = $request->get_param('totalPoints');
    $promotion_code = $request->get_param('promotionCode');
    $is_promotion_user = $request->get_param('isPromotionUser');
    $username = $request->get_param('username');
    $chips = $request->get_param('chips'); // Chips of the current user

    error_log("Received parameters: diceAmount=$dice_amount, totalPoints=$total_points, promotionCode=$promotion_code, isPromotionUser=$is_promotion_user, username=$username, chips=$chips");

    // Check if the parameters are provided
    if (empty($dice_amount) || empty($total_points) || !isset($is_promotion_user) || empty($username) || empty($chips)) {
        // Parameters are missing, return an error
        $error = new WP_Error(400, 'All parameters are required.', array('status' => 'missing_parameters'));
        error_log("Error: Missing parameters");
        return new WP_REST_Response($error, 400);
    }

    // Get user ID
    $user = get_user_by('login', $username);
    if (!$user) {
        $error = new WP_Error(400, 'Invalid username', array('status' => 'no_user'));
        error_log("Error: Invalid username");
        return new WP_REST_Response($error, 404);
    }
    $user_id = $user->ID;
    error_log("User ID: $user_id");

    // PvE mode: If promotion_code is empty and is_promotion_user is false
    if (empty($promotion_code) && !$is_promotion_user) {
        // Generate a random boolean to decide if the user wins
        $user_wins = (bool)rand(0, 1);
        error_log("PvE mode: User wins: " . ($user_wins ? 'true' : 'false'));

        if ($user_wins) {
            // User wins: Add the chips to their balance
            mycred_add('dice_game_win', $user_id, $chips, 'PvE dice game win');
            $new_balance = mycred_get_users_balance($user_id);
            error_log("PvE mode: User wins. New balance: $new_balance");

            // Log dice data for PvE win
            $wpdb->insert($wpdb->prefix . 'dice_data', array(
                'user_id' => $user_id,
                'dice_amount' => $dice_amount,
                'total_points' => $total_points,
                'promotion_code' => $promotion_code,
                'is_promotion_user' => $is_promotion_user,
                'chips' => $chips,
                'deduct_chips' => 0,
                'increase_chips' => $chips,
                'total_chips' => $new_balance,
                'parent_user_id' => null,
                'child_user_id' => null,
                'created_at' => current_time('mysql'),
            ));
            error_log("Logged dice data for PvE win");

            return new WP_REST_Response(array(
                'code' => 200,
                'message' => 'PvE game processed successfully. User wins.',
                'data' => array(
                    'status' => 'success',
                    'balance' => $new_balance,
                    'result' => $chips * 2, // Positive value for win
                )
            ), 200);
        } else {
            // User loses: Deduct the chips from their balance
            mycred_subtract('dice_game_loss', $user_id, $chips, 'PvE dice game loss');
            $new_balance = mycred_get_users_balance($user_id);
            error_log("PvE mode: User loses. New balance: $new_balance");

            // Log dice data for PvE loss
            $wpdb->insert($wpdb->prefix . 'dice_data', array(
                'user_id' => $user_id,
                'dice_amount' => $dice_amount,
                'total_points' => $total_points,
                'promotion_code' => $promotion_code,
                'is_promotion_user' => $is_promotion_user,
                'chips' => $chips,
                'deduct_chips' => $chips,
                'increase_chips' => 0,
                'total_chips' => $new_balance,
                'parent_user_id' => null,
                'child_user_id' => null,
                'created_at' => current_time('mysql'),
            ));
            error_log("Logged dice data for PvE loss");

            return new WP_REST_Response(array(
                'code' => 200,
                'message' => 'PvE game processed successfully. User loses.',
                'data' => array(
                    'status' => 'success',
                    'balance' => $new_balance,
                    'result' => -$chips, // Negative value for loss
                )
            ), 200);
        }
    }

    // Generate a random promotion code if it is empty and the user is a promotion user
    if (empty($promotion_code) && $is_promotion_user) {
        $characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        $promotion_code = '';
        for ($i = 0; $i < 16; $i++) {
            $promotion_code .= $characters[rand(0, strlen($characters) - 1)];
        }
        error_log("Generated promotion code: $promotion_code");
    }

    // Check if the promotion code has already been used
    $promotion_entry = $wpdb->get_row($wpdb->prepare(
        "SELECT * FROM {$wpdb->prefix}dice_data WHERE promotion_code = %s AND (parent_user_id IS NOT NULL OR child_user_id IS NOT NULL)",
        $promotion_code
    ));

    if ($promotion_entry) {
        $error = new WP_Error(400, 'This promotion code has already been used', array('status' => 'promotion_used'));
        error_log("Error: Promotion code already used");
        return new WP_REST_Response($error, 400);
    }

    // Common operations for both parent and child users
    $child_balance = mycred_get_users_balance($user_id);
    error_log("Child balance: $child_balance");

    // If the user is a parent, we don't need to query the parent from the promotion code
    if ($is_promotion_user) {
        $parent_balance = mycred_get_users_balance($user_id);
        error_log("Parent balance: $parent_balance");

        if ($parent_balance < $chips) {
            $error = new WP_Error(400, 'Insufficient balance for parent user', array('status' => 'insufficient_balance'));
            error_log("Error: Insufficient balance for parent user");
            return new WP_REST_Response($error, 400);
        }

        // Deduct chips from parent user
        mycred_subtract('dice_game_loss', $user_id, $chips, 'Dice game loss');
        $parent_balance = mycred_get_users_balance($user_id); // Updated balance
        error_log("Updated parent balance after deduction: $parent_balance");

        // Log dice data for parent
        $wpdb->insert($wpdb->prefix . 'dice_data', array(
            'user_id' => $user_id,
            'dice_amount' => $dice_amount,
            'total_points' => $total_points,
            'promotion_code' => $promotion_code,
            'is_promotion_user' => $is_promotion_user,
            'chips' => $chips,
            'deduct_chips' => $chips,
            'increase_chips' => 0,
            'total_chips' => $parent_balance,
            'parent_user_id' => null,
            'child_user_id' => null,
            'created_at' => current_time('mysql'),
        ));
        error_log("Logged dice data for parent user");

        return new WP_REST_Response(array(
            'code' => 200,
            'message' => 'Parent game processed successfully',
            'data' => array(
                'status' => 'success',
                'balance' => $parent_balance,
                'result' => -$chips, // Negative value for loss
                'promotion_code' => $promotion_code // Include the generated promotion code
            )
        ), 200);
    } else {
        // If the user is a child, find the parent by promotion code
        $parent_entry = $wpdb->get_row($wpdb->prepare(
            "SELECT * FROM {$wpdb->prefix}dice_data WHERE promotion_code = %s AND is_promotion_user = 1",
            $promotion_code
        ));

        if (!$parent_entry) {
            $error = new WP_Error(404, 'Invalid promotion code or parent not found', array('status' => 'no_parent'));
            error_log("Error: Invalid promotion code or parent not found");
            return new WP_REST_Response($error, 404);
        }

        $parent_user_id = $parent_entry->user_id;
        $parent_balance = mycred_get_users_balance($parent_user_id);
        error_log("Parent user ID: $parent_user_id, Parent balance: $parent_balance");

        // Ensure child has enough balance and refund parent if not
        if ($child_balance < $chips) {
            // Refund parent if child has insufficient balance
            mycred_add('dice_game_win', $parent_user_id, $parent_balance, 'Refund for insufficient child points');
            $error = new WP_Error(400, 'Child user does not have enough points. Parent refunded.', array('status' => 'insufficient_balance'));
            error_log("Error: Child user does not have enough points. Parent refunded.");
            return new WP_REST_Response($error, 400);
        }

        // Deduct chips from child user
        mycred_subtract('dice_game_loss', $user_id, $chips, 'Dice game loss');
        $child_balance = mycred_get_users_balance($user_id); // Updated child balance
        error_log("Updated child balance after deduction: $child_balance");

        // Calculate winner and loser
        $winner_user_id = ($total_points > $parent_entry->total_points) ? $user_id : $parent_user_id;
        error_log("Winner user ID: $winner_user_id");

        // Service charge and winner chips calculation
        $total_chips = $chips + $parent_entry->chips;
        $service_charge = $total_chips * 0.005; // 0.5% service charge
        $winner_chips = $total_chips - $service_charge;
        error_log("Total chips: $total_chips, Service charge: $service_charge, Winner chips: $winner_chips");

        // Add chips to the winner
        mycred_add('dice_game_win', $winner_user_id, $winner_chips, 'Dice game win');
        
        // Update both the parent and the child balance
        $parent_balance = mycred_get_users_balance($parent_user_id);
        $child_balance = mycred_get_users_balance($user_id); // Updated child balance
        error_log("Updated parent balance: $parent_balance, Updated child balance: $child_balance");

        // Log dice data for the child user
        $wpdb->insert($wpdb->prefix . 'dice_data', array(
            'user_id' => $user_id,
            'dice_amount' => $dice_amount,
            'total_points' => $total_points,
            'promotion_code' => $promotion_code,
            'is_promotion_user' => $is_promotion_user,
            'chips' => $chips,
            'deduct_chips' => $chips,
            'increase_chips' => $winner_chips,
            'total_chips' => $child_balance,
            'parent_user_id' => $parent_user_id,
            'child_user_id' => null,
            'created_at' => current_time('mysql'),
        ));
        error_log("Logged dice data for child user");

        // Log dice data for the parent user
        $wpdb->insert($wpdb->prefix . 'dice_data', array(
            'user_id' => $parent_user_id,
            'dice_amount' => $dice_amount,
            'total_points' => $total_points,
            'promotion_code' => $promotion_code,
            'is_promotion_user' => $is_promotion_user,
            'chips' => $parent_entry->chips,
            'deduct_chips' => 0,
            'increase_chips' => $winner_chips,
            'total_chips' => $parent_balance,
            'parent_user_id' => null,
            'child_user_id' => $user_id,
            'created_at' => current_time('mysql'),
        ));
        error_log("Logged dice data for parent user");

        return new WP_REST_Response(array(
            'code' => 200,
            'message' => 'Game processed successfully',
            'data' => array(
                'status' => 'success',
                'balance' => $child_balance,
                'result' => ($winner_user_id === $user_id) ? $winner_chips : -$chips, // Positive for win, negative for loss
                'promotion_code' => $promotion_code // Include the generated promotion code
            )
        ), 200);
    }
}

```