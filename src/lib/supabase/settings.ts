import { supabase } from './client'

export interface BusinessInfo {
    business_name: string
    phone: string
    email: string
    address: string
    is_open: boolean
}

export interface BusinessHours {
    [key: string]: {
        open: string
        close: string
        closed: boolean
    }
}

export interface DeliverySettings {
    delivery_fee: number
    min_order_amount: number
    free_delivery_threshold?: number
}

export const settingsService = {
    // Get business info
    async getBusinessInfo(): Promise<BusinessInfo | null> {
        const { data, error } = await supabase
            .from('settings')
            .select('value')
            .eq('key', 'business_info')
            .single()

        if (error) {
            console.error('Error fetching business info:', error)
            return null
        }

        return data?.value as BusinessInfo
    },

    // Update business info
    async updateBusinessInfo(info: BusinessInfo): Promise<boolean> {
        const { error } = await supabase
            .from('settings')
            .update({ value: info })
            .eq('key', 'business_info')

        if (error) {
            console.error('Error updating business info:', error)
            return false
        }

        return true
    },

    // Get business hours
    async getBusinessHours(): Promise<BusinessHours | null> {
        const { data, error } = await supabase
            .from('settings')
            .select('value')
            .eq('key', 'business_hours')
            .single()

        if (error) {
            console.error('Error fetching business hours:', error)
            return null
        }

        return data?.value as BusinessHours
    },

    // Update business hours
    async updateBusinessHours(hours: BusinessHours): Promise<boolean> {
        const { error } = await supabase
            .from('settings')
            .update({ value: hours })
            .eq('key', 'business_hours')

        if (error) {
            console.error('Error updating business hours:', error)
            return false
        }

        return true
    },

    // Get delivery settings
    async getDeliverySettings(): Promise<DeliverySettings | null> {
        const { data, error } = await supabase
            .from('settings')
            .select('value')
            .eq('key', 'delivery_settings')
            .single()

        if (error) {
            console.error('Error fetching delivery settings:', error)
            return null
        }

        return data?.value as DeliverySettings
    },

    // Update delivery settings
    async updateDeliverySettings(settings: DeliverySettings): Promise<boolean> {
        const { error } = await supabase
            .from('settings')
            .update({ value: settings })
            .eq('key', 'delivery_settings')

        if (error) {
            console.error('Error updating delivery settings:', error)
            return false
        }

        return true
    },

    // Get all settings at once
    async getAllSettings() {
        const [businessInfo, businessHours, deliverySettings] = await Promise.all([
            this.getBusinessInfo(),
            this.getBusinessHours(),
            this.getDeliverySettings()
        ])

        return {
            businessInfo,
            businessHours,
            deliverySettings
        }
    }
}
