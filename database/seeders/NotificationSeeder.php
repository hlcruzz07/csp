<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class NotificationSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $users = User::all();

        if ($users->isEmpty()) {
            $this->command->warn('No users found. Please seed users before running NotificationSeeder.');
            return;
        }

        $sampleNotifications = [
            ['title' => 'New Message', 'description' => 'You have received a new message from an admin.'],
            ['title' => 'Order Shipped', 'description' => 'Your recent order has been shipped.'],
            ['title' => 'Payment Successful', 'description' => 'Your payment was processed successfully.'],
            ['title' => 'Profile Updated', 'description' => 'Your profile information was updated.'],
            ['title' => 'New Comment', 'description' => 'Someone commented on your post.'],
            ['title' => 'Password Changed', 'description' => 'Your account password was changed successfully.'],
            ['title' => 'Subscription Renewed', 'description' => 'Your subscription has been renewed.'],
            ['title' => 'New Follower', 'description' => 'You have a new follower.'],
        ];

        foreach (range(1, 50) as $i) {
            $notification = $sampleNotifications[array_rand($sampleNotifications)];
            $user = $users->random();
            $isRead = (bool) random_int(0, 1);

            $user->notifications()->create([
                'id' => Str::uuid(),
                'type' => $notification['title'],
                'data' => [
                    'type' => $notification['title'],
                    'title' => $notification['title'],
                    'description' => $notification['description'],
                ],
                'read_at' => $isRead ? now() : null,
            ]);
        }

        $this->command->info('Notifications seeded successfully.');
    }
}