import { Progress } from "@/components/react/ui/progress";
import { atom } from "nanostores";
import { useStore } from "@nanostores/react";
import { useEffect } from "react";

// Progress store with atomic state management
export const progressStore = atom<{
    isVisible: boolean;
    value: number;
}>({
    isVisible: false,
    value: 0,
});

// Helper functions to control the progress
export function showProgress(): void {
    progressStore.set({ isVisible: true, value: 0 });
}

export function updateProgress(value: number): void {
    progressStore.set({ isVisible: true, value });
}

export function hideProgress(): void {
    progressStore.set({ isVisible: false, value: 0 });
}

// Simulate progress for demo purposes
export async function simulateProgress(): Promise<void> {
    showProgress();
    return new Promise<void>((resolve) => {
        let progress = 0;
        const interval = setInterval(() => {
            progress += 5;
            updateProgress(progress);

            if (progress >= 100) {
                clearInterval(interval);
                setTimeout(() => {
                    hideProgress();
                    resolve();
                }, 500); // Wait a bit at 100% for visual effect
            }
        }, 100);
    });
}

export function GlobalProgress() {
    const { isVisible, value } = useStore(progressStore);

    useEffect(() => {
        // Cleanup function
        return () => {
            hideProgress();
        };
    }, []);

    if (!isVisible) return null;

    return (
        <div className="fixed top-0 left-0 right-0 z-50 h-1">
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-blue-500 opacity-20" />
            <Progress
                value={value}
                className="h-1 rounded-none"
                style={{
                    background: 'transparent',
                    backgroundImage: 'linear-gradient(to right, #3b82f6, #06b6d4)',
                    backgroundSize: `${value}% 100%`,
                    backgroundRepeat: 'no-repeat',
                    transition: 'background-size 0.3s ease-in-out'
                }}
            />
        </div>
    );
} 