
export function UserAvatar({ url, name }: { url?: string | null, name?: string | null }) {
    if (url) {
        return <img src={url} alt={name || 'User'} className="w-full h-full object-cover rounded-full" />
    }

    // Get first 2 letters of name
    const getInitials = (name?: string | null) => {
        if (!name) return 'U';
        const trimmed = name.trim();
        if (trimmed.length === 0) return 'U';
        if (trimmed.length === 1) return trimmed.toUpperCase();
        return trimmed.substring(0, 2).toUpperCase();
    };

    return (
        <div className="w-full h-full bg-gradient-to-br from-sky-500 via-indigo-500 to-purple-600 flex items-center justify-center rounded-full text-white font-bold text-xs shadow-lg">
            {getInitials(name)}
        </div>
    )
}
