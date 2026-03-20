import * as React from 'react'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    icon?: React.ReactNode
    containerClassName?: string
}

export function Input({ className, icon, containerClassName, ref, ...props }: InputProps & { ref?: React.Ref<HTMLInputElement> }) {
    const defaultClasses =
        'w-full bg-transparent border border-black/20 dark:border-white/20 focus:border-black dark:focus:border-white outline-none py-4 font-mono text-sm tracking-widest uppercase transition-colors placeholder:opacity-30 rounded-none disabled:opacity-40'

    const paddingClasses = icon ? 'pl-12 pr-4' : 'px-4'

    const combinedClasses = `${defaultClasses} ${paddingClasses} ${className || ''}`.trim()

    if (icon) {
        return (
            <div className={`relative w-full ${containerClassName || ''}`.trim()}>
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none opacity-50">
                    {icon}
                </div>
                <input ref={ref} className={combinedClasses} {...props} />
            </div>
        )
    }

    return <input ref={ref} className={combinedClasses} {...props} />
}
